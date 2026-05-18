const { auth, db } = require('./config/firebase');

async function findAdmins() {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    if (snapshot.empty) {
      console.log('No admin users found in the database.');
      process.exit(0);
    }

    console.log('--- ADMIN ACCOUNTS FOUND ---');
    for (const doc of snapshot.docs) {
      const uid = doc.id;
      const data = doc.data();
      
      try {
        const userRecord = await auth.getUser(uid);
        console.log(`Name: ${data.name}`);
        console.log(`Email: ${userRecord.email}`);
        console.log(`District: ${data.area}`);
        console.log('---------------------------');
      } catch (err) {
        console.log(`UID: ${uid} (Error fetching email from Auth: ${err.message})`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findAdmins();
