const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, phone, area, email, password, adminCode } = req.body;

  if (!name || !phone || !area || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  let role = 'citizen';

  if (adminCode) {
    // 1. Check if there's a custom override for this district in .env (e.g. ADMIN_CODE_KOLKATA)
    const envOverrideKey = `ADMIN_CODE_${area.toUpperCase().replace(/\s+/g, '')}`;
    const explicitOverrideCode = process.env[envOverrideKey];
    
    // 2. Dynamically derive fallback code based on base ADMIN_SECRET_CODE
    const baseSecret = process.env.ADMIN_SECRET_CODE || 'loksetu-admin-2024';
    const derivedCode = `${baseSecret}-${area.toLowerCase().replace(/\s+/g, '')}`;

    // 3. Match against override, falling back to derived if no override is set
    const isValid = explicitOverrideCode ? (adminCode === explicitOverrideCode) : (adminCode === derivedCode);

    if (!isValid) {
      return res.status(401).json({ error: `Invalid admin verification code for district: ${area}` });
    }
    
    role = 'admin';
  }

  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`, // prefix with code if needed
    });

    const userId = userRecord.uid;

    // Create Firestore profile document
    await db.collection('users').doc(userId).set({
      name,
      phone,
      area,
      role,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Registration successful', role, uid: userId });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Get Firebase user record to retrieve UID
    const userRecord = await auth.getUserByEmail(email);
    const userId = userRecord.uid;

    // Check if the user has the admin role in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: User is not an administrator' });
    }

    // Now validate the password: it must match the global admin secret,
    // OR the district-specific override, OR the district-specific derived key.
    const area = userData.area;
    const baseSecret = process.env.ADMIN_SECRET_CODE || 'loksetu-admin-2024';
    const envOverrideKey = area ? `ADMIN_CODE_${area.toUpperCase().replace(/\s+/g, '')}` : '';
    const explicitOverrideCode = envOverrideKey ? process.env[envOverrideKey] : null;
    const derivedCode = area ? `${baseSecret}-${area.toLowerCase().replace(/\s+/g, '')}` : null;

    const isPasswordValid = 
      password === baseSecret || 
      (explicitOverrideCode ? (password === explicitOverrideCode) : (password === derivedCode));

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate Firebase custom token
    const customToken = await auth.createCustomToken(userId);
    res.json({ customToken });
  } catch (err) {
    console.error('Admin login error:', err);
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to authenticate admin' });
  }
});

module.exports = router;
