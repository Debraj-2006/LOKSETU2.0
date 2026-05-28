const express = require('express');
const multer = require('multer');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const authenticate = require('../middleware/authenticate');
const { uploadToCloudinary } = require('../services/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/complaints — create a new complaint
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  if (req.profile.role === 'admin') {
    return res.status(403).json({ error: 'Admins are not authorized to raise complaints' });
  }

  const { category, description, location_name, latitude, longitude, area } = req.body;

  if (!category || !description || !area) {
    return res.status(400).json({ error: 'category, description, and area are required' });
  }

  let photoUrl = null;
  if (req.file) {
    // Detect if Cloudinary is configured (i.e. not empty and not the default placeholder)
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

    if (isCloudinaryConfigured) {
      try {
        photoUrl = await uploadToCloudinary(req.file.buffer);
      } catch (err) {
        console.warn('Cloudinary upload failed, falling back to local file storage:', err);
      }
    }

    // Fall back to writing to local uploads directory if Cloudinary is not configured or failed
    if (!photoUrl) {
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `complaint_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, req.file.buffer);
        photoUrl = `/uploads/${filename}`;
        console.log(`Successfully stored image locally under: ${filepath}`);
      } catch (localErr) {
        console.error('Local backup image storage failed:', localErr);
        return res.status(500).json({ error: 'Photo upload failed: ' + localErr.message });
      }
    }
  }

  try {
    // Feature 5: Auto-Triage Department Dispatcher
    const deptKeywords = {
      'PWD Road Dept': ['road', 'pothole', 'street', 'crack', 'paving', 'tar', 'flyover', 'pavement', 'manhole', 'accident', 'bumper', 'divider', 'broken'],
      'Water Supply Board': ['water', 'pipe', 'leak', 'contamination', 'supply', 'sewage', 'drain', 'flood', 'tap', 'well', 'tank', 'dirty'],
      'Electricity Board': ['power', 'transformer', 'wiring', 'streetlight', 'blackout', 'electric', 'pole', 'current', 'meter', 'outage', 'electricity', 'wire'],
      'Sanitation Board': ['garbage', 'waste', 'dumping', 'litter', 'dustbin', 'toilet', 'smell', 'cleanliness', 'sanitation', 'clean', 'sweep', 'block']
    };

    let assignedDepartment = 'General Administration';
    const textToAnalyze = `${description} ${location_name || ''} ${category}`.toLowerCase();
    
    let maxMatches = 0;
    for (const [dept, keywords] of Object.entries(deptKeywords)) {
      let matches = 0;
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        const count = (textToAnalyze.match(regex) || []).length;
        matches += count;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        assignedDepartment = dept;
      }
    }

    if (maxMatches === 0) {
      if (category === 'road') assignedDepartment = 'PWD Road Dept';
      else if (category === 'water') assignedDepartment = 'Water Supply Board';
      else if (category === 'electricity') assignedDepartment = 'Electricity Board';
      else if (category === 'sanitation') assignedDepartment = 'Sanitation Board';
      else if (category === 'health_safety') assignedDepartment = 'Health & Safety Committee';
    }

    const complaintData = {
      citizen_id: req.profile.id,
      citizen_name: req.profile.name || 'Anonymous',
      citizen_phone: req.profile.phone || '',
      category,
      description,
      photo_url: photoUrl,
      location_name: location_name || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      area: area || req.profile.area,
      status: 'pending',
      upvote_count: 0,
      is_escalated: false,
      is_petition: false,
      resolved_image: null,
      assigned_department: assignedDepartment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await db.collection('complaints').add(complaintData);
    res.status(201).json({ id: docRef.id, ...complaintData });
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// GET /api/complaints/my — citizen's own complaints
router.get('/my', authenticate, async (req, res) => {
  const { status, category } = req.query;

  try {
    let query = db.collection('complaints').where('citizen_id', '==', req.profile.id);

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);

    const snapshot = await query.get();
    const complaints = [];

    for (const doc of snapshot.docs) {
      const c = doc.data();
      
      // Fetch updates subcollection
      const updatesSnapshot = await doc.ref.collection('updates').orderBy('created_at', 'desc').get();
      const updates = updatesSnapshot.docs.map(uDoc => ({ id: uDoc.id, ...uDoc.data() }));

      complaints.push({ id: doc.id, ...c, complaint_updates: updates });
    }

    // Sort by created_at desc (in JS to avoid composite index requirement in Firestore during dev setup)
    complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(complaints);
  } catch (err) {
    console.error('Get my complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/complaints/:id — get a single complaint
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('complaints').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = doc.data();

    // Check permissions (admins restricted to their district, citizens restricted to their own district's complaints)
    if (req.profile.role === 'admin') {
      const adminArea = req.profile.area || '';
      if (!complaint.area || complaint.area.toLowerCase() !== adminArea.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied: Admin is restricted to their registered district' });
      }
    } else {
      const userArea = req.profile.area || '';
      const isCreator = complaint.citizen_id === req.profile.id;
      const isSameDistrict = complaint.area && complaint.area.toLowerCase() === userArea.toLowerCase();
      
      if (!isCreator && !isSameDistrict) {
        return res.status(403).json({ error: 'Access denied: You can only view complaints from your registered district' });
      }
    }

    // Get upvote status
    const upvoteDocId = `${req.profile.id}_${id}`;
    const upvoteDoc = await db.collection('upvotes').doc(upvoteDocId).get();
    const hasUpvoted = upvoteDoc.exists;

    // Fetch updates subcollection
    const updatesSnapshot = await doc.ref.collection('updates').orderBy('created_at', 'desc').get();
    const updates = updatesSnapshot.docs.map(uDoc => ({ id: uDoc.id, ...uDoc.data() }));

    // Fetch comments subcollection
    const commentsSnapshot = await doc.ref.collection('comments').orderBy('created_at', 'asc').get();
    const comments = commentsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() }));

    res.json({
      id: doc.id,
      ...complaint,
      hasUpvoted,
      complaint_updates: updates,
      comments: comments,
      profiles: {
        name: complaint.citizen_name,
        phone: complaint.citizen_phone,
        area: complaint.area,
      }
    });
  } catch (err) {
    console.error('Get complaint details error:', err);
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// POST /api/complaints/:id/comments — add a public comment
router.post('/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const complaintRef = db.collection('complaints').doc(id);
    const complaintDoc = await complaintRef.get();

    if (!complaintDoc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintDoc.data();
    const userArea = req.profile.area || '';

    // Enforce that citizens can only comment on complaints within their registered district
    if (req.profile.role !== 'admin' && (!complaint.area || complaint.area.toLowerCase() !== userArea.toLowerCase())) {
      return res.status(403).json({ error: 'You can only comment on complaints within your registered district' });
    }

    const commentData = {
      citizen_id: req.profile.id,
      citizen_name: req.profile.name || 'Anonymous',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    const newCommentRef = await complaintRef.collection('comments').add(commentData);

    res.status(201).json({ id: newCommentRef.id, ...commentData });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST /api/complaints/:id/upvote — toggle upvote
router.post('/:id/upvote', authenticate, async (req, res) => {
  const { id } = req.params;
  const citizenId = req.profile.id;
  const upvoteDocId = `${citizenId}_${id}`;

  try {
    const upvoteRef = db.collection('upvotes').doc(upvoteDocId);
    const complaintRef = db.collection('complaints').doc(id);

    const upvoted = await db.runTransaction(async (transaction) => {
      const upvoteDoc = await transaction.get(upvoteRef);
      const complaintDoc = await transaction.get(complaintRef);

      if (!complaintDoc.exists) {
        throw new Error('Complaint not found');
      }

      const complaint = complaintDoc.data();
      const userArea = req.profile.area || '';

      // Enforce that citizens can only upvote complaints within their registered district
      if (req.profile.role !== 'admin' && (!complaint.area || complaint.area.toLowerCase() !== userArea.toLowerCase())) {
        throw new Error('You can only upvote complaints within your registered district');
      }

      if (upvoteDoc.exists) {
        // Remove upvote
        transaction.delete(upvoteRef);
        const newUpvotes = (complaint.upvote_count || 0) - 1;
        const updates = {
          upvote_count: admin.firestore.FieldValue.increment(-1),
          updated_at: new Date().toISOString()
        };
        if (newUpvotes < 20) {
          updates.is_petition = false;
        }
        transaction.update(complaintRef, updates);
        return false;
      } else {
        // Add upvote
        transaction.set(upvoteRef, {
          complaint_id: id,
          citizen_id: citizenId,
          created_at: new Date().toISOString(),
        });
        const newUpvotes = (complaint.upvote_count || 0) + 1;
        const updates = {
          upvote_count: admin.firestore.FieldValue.increment(1),
          updated_at: new Date().toISOString()
        };
        if (newUpvotes >= 20) {
          updates.is_petition = true;
        }
        transaction.update(complaintRef, updates);
        return true;
      }
    });

    res.json({ upvoted });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: err.message || 'Failed to toggle upvote' });
  }
});

// DELETE /api/complaints/:id — citizen deletes their own complaint
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const complaintRef = db.collection('complaints').doc(id);
    const complaintDoc = await complaintRef.get();

    if (!complaintDoc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintDoc.data();

    // Only the citizen who filed it can delete it
    if (complaint.citizen_id !== req.profile.id) {
      return res.status(403).json({ error: 'You can only delete your own complaints' });
    }

    // Delete subcollections: updates
    const updatesSnap = await complaintRef.collection('updates').get();
    const batch1 = db.batch();
    updatesSnap.docs.forEach(doc => batch1.delete(doc.ref));
    if (updatesSnap.docs.length > 0) await batch1.commit();

    // Delete subcollections: comments
    const commentsSnap = await complaintRef.collection('comments').get();
    const batch2 = db.batch();
    commentsSnap.docs.forEach(doc => batch2.delete(doc.ref));
    if (commentsSnap.docs.length > 0) await batch2.commit();

    // Delete related upvotes
    const upvotesSnap = await db.collection('upvotes').where('complaint_id', '==', id).get();
    const batch3 = db.batch();
    upvotesSnap.docs.forEach(doc => batch3.delete(doc.ref));
    if (upvotesSnap.docs.length > 0) await batch3.commit();

    // Delete related notifications
    const notificationsSnap = await db.collection('notifications').where('complaint_id', '==', id).get();
    const batch4 = db.batch();
    notificationsSnap.docs.forEach(doc => batch4.delete(doc.ref));
    if (notificationsSnap.docs.length > 0) await batch4.commit();

    // Finally, delete the complaint document
    await complaintRef.delete();

    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Delete complaint error:', err);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

module.exports = router;
