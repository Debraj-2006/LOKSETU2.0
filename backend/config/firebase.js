const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
  let credentials;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Parse service account from env variable
    credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Look for serviceAccountKey.json locally
    const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      credentials = require(keyPath);
    } else {
      // Scan the backend directory for any JSON file that is a Firebase service account key
      try {
        const rootDir = path.join(__dirname, '..');
        const files = fs.readdirSync(rootDir);
        const serviceAccountFile = files.find(file => {
          if (file.endsWith('.json') && file !== 'package.json' && file !== 'package-lock.json' && file !== 'serviceAccountKey.json.example') {
            try {
              const content = JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8'));
              return content.type === 'service_account';
            } catch {
              return false;
            }
          }
          return false;
        });

        if (serviceAccountFile) {
          credentials = require(path.join(rootDir, serviceAccountFile));
          console.log(`💡 Automatically discovered Firebase service account key: ${serviceAccountFile}`);
        } else {
          console.warn('⚠️  Warning: Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY env or add backend/serviceAccountKey.json');
        }
      } catch (scanErr) {
        console.warn('⚠️  Warning: Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY env or add backend/serviceAccountKey.json');
      }
    }
  }

  if (credentials) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } else {
    // Initialize with dummy projectId so that properties like auth() and firestore() compile on boot without crashing
    admin.initializeApp({
      projectId: 'loksetu-placeholder'
    });
    console.warn('❌  Error: Firebase service account key is missing!');
    console.warn('👉  Please place your downloaded service account key JSON inside "backend/serviceAccountKey.json"');
    console.warn('👉  Once added, restart the backend server so the app can talk to Firebase.');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
