const cron = require('node-cron');
const { db } = require('../config/database');
const { audit } = require('../config/logger');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cleanup cron job...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Hard delete users soft-deleted more than 30 days ago
    const deletedUsers = await db('users')
      .whereNotNull('deleted_at')
      .andWhere('deleted_at', '<', thirtyDaysAgo);

    if (deletedUsers.length > 0) {
      const userIds = deletedUsers.map(u => u.id);
      
      // Delete their dependencies first (or rely on CASCADE if setup)
      await db('sessions').whereIn('user_id', userIds).delete();
      await db('user_roles').whereIn('user_id', userIds).delete();
      await db('password_history').whereIn('user_id', userIds).delete();
      
      // Finally delete the users
      const deletedCount = await db('users').whereIn('id', userIds).delete();
      
      await audit('SYSTEM_CLEANUP', null, { 
        ip: '127.0.0.1', 
        details: { action: 'permanent_delete', count: deletedCount, users: userIds } 
      });
      console.log(`Permanently deleted ${deletedCount} users.`);
    }
  } catch (error) {
    console.error('Error in daily cleanup cron job:', error);
  }
});
