const { auth } = require('./config/firebase');

async function resetPasswords() {
  const emails = [
    'sefalidebnath48569@gmail.com',
    'admin-valid-849653@example.com'
  ];
  
  const newPassword = 'password1234';

  for (const email of emails) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, {
        password: newPassword
      });
      console.log(`✅ Successfully updated password for ${email} to: ${newPassword}`);
    } catch (err) {
      console.error(`❌ Error updating password for ${email}:`, err.message);
    }
  }
  process.exit(0);
}

resetPasswords();
