const cron = require('node-cron');
const { db } = require('../config/firebase');

const ESCALATION_DAYS = 7;

const runEscalation = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ESCALATION_DAYS);

  try {
    const snapshot = await db.collection('complaints')
      .where('is_escalated', '==', false)
      .get();

    if (snapshot.empty) {
      console.log('⏰  Escalation check completed: no matching complaints');
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const unresolved = !['resolved', 'cancelled'].includes(data.status);
      const isOlderThanCutoff = new Date(data.created_at) < cutoff;

      if (unresolved && isOlderThanCutoff) {
        batch.update(doc.ref, { is_escalated: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`🔴  Escalation: flagged ${count} complaints as escalated`);
    } else {
      console.log('⏰  Escalation check completed: no complaints older than 7 days');
    }
  } catch (err) {
    console.error('❌ Escalation cron error:', err.message);
  }
};

const startEscalationCron = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', runEscalation);
  console.log('⏰  Escalation cron scheduled (hourly)');
};

module.exports = { startEscalationCron, runEscalation };
