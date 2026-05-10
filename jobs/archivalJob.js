const cron = require('node-cron');
const Record = require('../models/Record');
const Policy = require('../models/Policy');

// Run job every day at midnight (or every minute for testing)
// using "0 * * * * *" (every minute) for demo purposes, so it archives faster
cron.schedule('* * * * *', async () => {
  try {
    const policies = await Policy.find();
    if (policies.length === 0) return;

    const activeRecords = await Record.find({ status: 'ACTIVE' });
    const now = new Date();
    
    let archivedCount = 0;

    for (const record of activeRecords) {
      const policy = policies.find(p => p.category === record.category);
      if (policy) {
        const expiryDate = new Date(record.createdAt);
        expiryDate.setDate(expiryDate.getDate() + policy.retentionDays);
        
        if (now >= expiryDate) {
          record.status = 'ARCHIVED';
          await record.save();
          archivedCount++;
        }
      }
    }
    
    if (archivedCount > 0) {
      console.log(`[Archival Job] Archived ${archivedCount} expired records at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('[Archival Job Error]', error);
  }
});
