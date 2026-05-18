const express = require('express');
const multer = require('multer');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const { uploadToCloudinary } = require('../services/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// GET /api/admin/complaints — all complaints with filters (isolated by district)
router.get('/complaints', async (req, res) => {
  const { category, area, status, date_from, date_to, escalated, assigned_department, page = 1, limit = 20 } = req.query;

  try {
    const adminArea = req.profile?.area || '';
    if (!adminArea) {
      return res.status(403).json({ error: 'Access denied: Admin profile has no registered area/district' });
    }

    let complaintsRef = db.collection('complaints');
    let snapshot = await complaintsRef.get();
    let complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // FORCE district-level isolation (Admin can ONLY see their own district)
    complaints = complaints.filter(c => c.area && c.area.toLowerCase() === adminArea.toLowerCase());

    // Apply in-memory search/filters
    if (category) {
      complaints = complaints.filter(c => c.category === category);
    }
    if (status) {
      complaints = complaints.filter(c => c.status === status);
    }
    if (escalated === 'true') {
      complaints = complaints.filter(c => c.is_escalated === true);
    }
    if (assigned_department) {
      complaints = complaints.filter(c => c.assigned_department === assigned_department);
    }
    if (date_from) {
      complaints = complaints.filter(c => c.created_at >= date_from);
    }
    if (date_to) {
      complaints = complaints.filter(c => c.created_at <= date_to + 'T23:59:59Z');
    }

    // Sort: Escalated active first, then Petitions active, then Upvotes, then Date. Resolved at bottom.
    complaints.sort((a, b) => {
      const aResolved = ['resolved', 'cancelled'].includes(a.status);
      const bResolved = ['resolved', 'cancelled'].includes(b.status);
      
      // Put resolved/cancelled at the bottom
      if (aResolved !== bResolved) {
        return aResolved ? 1 : -1;
      }

      const aEscalated = a.is_escalated && !aResolved;
      const bEscalated = b.is_escalated && !bResolved;
      if (aEscalated !== bEscalated) {
        return bEscalated ? -1 : 1;
      }

      const aPetition = a.is_petition && !aResolved;
      const bPetition = b.is_petition && !bResolved;
      if (aPetition !== bPetition) {
        return bPetition ? -1 : 1;
      }

      // Sort by upvote_count desc
      if ((b.upvote_count || 0) !== (a.upvote_count || 0)) {
        return (b.upvote_count || 0) - (a.upvote_count || 0);
      }

      // Fallback: Date desc
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const total = complaints.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedComplaints = complaints.slice(offset, offset + parseInt(limit));

    // Map profile data structure to match what frontend expects
    const formattedData = paginatedComplaints.map(c => ({
      ...c,
      profiles: {
        name: c.citizen_name,
        phone: c.citizen_phone,
        area: c.area
      }
    }));

    res.json({ data: formattedData, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Admin complaints fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/admin/stats — dashboard statistics (isolated by district)
router.get('/stats', async (req, res) => {
  try {
    const adminArea = req.profile?.area || '';
    if (!adminArea) {
      return res.status(403).json({ error: 'Access denied: Admin profile has no registered area/district' });
    }

    const snapshot = await db.collection('complaints').get();
    const allData = snapshot.docs.map(doc => doc.data());

    // FORCE district-level isolation for statistics
    const localData = allData.filter(c => c.area && c.area.toLowerCase() === adminArea.toLowerCase());

    const categoryCounts = { electricity: 0, road: 0, water: 0, sanitation: 0, other: 0 };

    localData.forEach((c) => {
      const cat = c.category;
      if (cat && categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else if (cat) {
        categoryCounts.other++;
      }
    });

    const stats = {
      total: localData.length,
      pending: localData.filter((c) => c.status === 'pending').length,
      in_progress: localData.filter((c) => c.status === 'in_progress').length,
      resolved: localData.filter((c) => c.status === 'resolved').length,
      cancelled: localData.filter((c) => c.status === 'cancelled').length,
      escalated: localData.filter((c) => c.is_escalated).length,
      categoryCounts,
      localCategoryCounts: categoryCounts,
      localTotal: localData.length,
      adminArea
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin stats fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// PATCH /api/admin/complaints/:id — update status + add remark (isolated by district)
router.patch('/complaints/:id', upload.single('resolvedImage'), async (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  const validStatuses = ['pending', 'in_progress', 'resolved', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const adminArea = req.profile?.area || '';
    if (!adminArea) {
      return res.status(403).json({ error: 'Access denied: Admin profile has no registered area/district' });
    }

    const complaintRef = db.collection('complaints').doc(id);
    const complaintDoc = await complaintRef.get();

    if (!complaintDoc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintDoc.data();

    // FORCE district-level isolation for updates
    if (!complaint.area || complaint.area.toLowerCase() !== adminArea.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied: Admin is restricted to their registered district' });
    }

    let resolvedImageUrl = null;
    if (req.file && status === 'resolved') {
      const isCloudinaryConfigured = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

      if (isCloudinaryConfigured) {
        try {
          resolvedImageUrl = await uploadToCloudinary(req.file.buffer);
        } catch (err) {
          console.warn('Cloudinary upload failed for resolution, falling back to local:', err);
        }
      }

      if (!resolvedImageUrl) {
        try {
          const fs = require('fs');
          const path = require('path');
          const uploadsDir = path.join(__dirname, '../uploads');

          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const ext = path.extname(req.file.originalname) || '.jpg';
          const filename = `resolved_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
          const filepath = path.join(uploadsDir, filename);

          fs.writeFileSync(filepath, req.file.buffer);
          resolvedImageUrl = `/uploads/${filename}`;
        } catch (localErr) {
          console.error('Local photo upload failed:', localErr);
          return res.status(500).json({ error: 'Photo upload failed: ' + localErr.message });
        }
      }
    }

    // Update complaint status
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resolvedImageUrl) {
      updateData.resolved_image = resolvedImageUrl;
    }

    await complaintRef.update(updateData);

    // Add update log in subcollection
    await complaintRef.collection('updates').add({
      admin_id: req.profile.id,
      admin_name: req.profile.name || 'Admin',
      new_status: status,
      remark: remark || null,
      created_at: new Date().toISOString(),
    });

    // Create notification for citizen
    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved ✅',
      cancelled: 'Cancelled',
    };

    await db.collection('notifications').add({
      citizen_id: complaint.citizen_id,
      complaint_id: id,
      message: `Your complaint status has been updated to "${statusLabels[status]}"${remark ? `. Remark: ${remark}` : '.'}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    res.json({ message: 'Complaint updated successfully' });
  } catch (err) {
    console.error('Admin update complaint error:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

module.exports = router;
