const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const authenticate = require('../middleware/authenticate');

// GET /api/notifications — get my notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('citizen_id', '==', req.profile.id)
      .get();

    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by created_at desc in memory
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit to 50
    const limited = notifications.slice(0, 50);
    res.json(limited);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read — mark as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notifRef = db.collection('notifications').doc(req.params.id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (doc.data().citizen_id !== req.profile.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await notifRef.update({ is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('citizen_id', '==', req.profile.id)
      .where('is_read', '==', false)
      .get();

    if (snapshot.empty) {
      return res.json({ message: 'No unread notifications' });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { is_read: true });
    });

    await batch.commit();
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;
