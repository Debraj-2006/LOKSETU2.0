const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');

// GET /api/schemes — public retrieve all schemes
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('schemes').get();
    const schemes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by created_at desc
    schemes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(schemes);
  } catch (err) {
    console.error('Fetch schemes error:', err);
    res.status(500).json({ error: 'Failed to fetch government schemes' });
  }
});

// POST /api/schemes — announce scheme (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title, description, department, eligibility, benefits, apply_link } = req.body;

  if (!title || !description || !department) {
    return res.status(400).json({ error: 'Title, description, and department are required' });
  }

  try {
    const newScheme = {
      title,
      description,
      department,
      eligibility: eligibility || 'Open to all citizens',
      benefits: benefits || 'Standard benefits apply',
      apply_link: apply_link || null,
      created_at: new Date().toISOString(),
      created_by: req.profile.id,
      created_by_name: req.profile.name || 'Admin',
    };

    const docRef = await db.collection('schemes').add(newScheme);
    res.status(201).json({ id: docRef.id, ...newScheme });
  } catch (err) {
    console.error('Create scheme error:', err);
    res.status(500).json({ error: 'Failed to create scheme' });
  }
});

// DELETE /api/schemes/:id — delete scheme (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection('schemes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    await docRef.delete();
    res.json({ message: 'Scheme deleted successfully' });
  } catch (err) {
    console.error('Delete scheme error:', err);
    res.status(500).json({ error: 'Failed to delete scheme' });
  }
});

module.exports = router;
