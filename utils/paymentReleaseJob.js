const cron = require('node-cron');
const { releaseHeldPayments } = require('../controllers/paymentController');

/**
 * Scheduled job to automatically release held payments to sellers
 * Runs daily at 2:00 AM to check for payments ready to be released
 * 
 * You can customize the schedule:
 * - '0 2 * * *' - Daily at 2:00 AM
 * - '0 */6 * * *' - Every 6 hours
 * - '0 0 * * *' - Daily at midnight
 * - '*/30 * * * *' - Every 30 minutes (for testing)
 */
const startPaymentReleaseJob = () => {
  // Run daily at 2:00 AM
  const schedule = process.env.PAYMENT_RELEASE_SCHEDULE || '0 2 * * *';
  
  console.log(`⏰ Payment release job scheduled: ${schedule}`);
  console.log(`📅 Job will run daily to check for payments ready to be released`);

  const job = cron.schedule(schedule, async () => {
    console.log(`\n🔄 [${new Date().toISOString()}] Running payment release job...`);
    
    try {
      // Call release function without res/next (for cron context)
      const result = await releaseHeldPayments();
      
      if (result.ordersReleased > 0) {
        console.log(`✅ Payment release job completed: ${result.ordersReleased} payment(s) released`);
      } else {
        console.log(`ℹ️  Payment release job completed: No payments ready for release`);
      }
    } catch (error) {
      console.error(`❌ Payment release job failed:`, error);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  return job;
};

module.exports = {
  startPaymentReleaseJob
};

