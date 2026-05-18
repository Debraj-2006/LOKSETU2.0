const { auth, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the Firebase ID Token
    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user profile from Firestore users collection
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    const profileData = userDoc.data();
    req.user = decodedToken;
    req.profile = { id: userDoc.id, ...profileData };
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authenticate;
