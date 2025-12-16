/**
 * Test Routes - Queue Testing
 */

import { Router } from 'express';
import { notificationQueue } from '../modules/notifications/queue.js';
import NotificationService from '../modules/notifications/notifications.service.js';

const router = Router();

// Test notification queue
router.post('/notification', async (req, res) => {
  try {
    console.log('🧪 Testing notification queue...');
    
    // Add test job to queue (using email-only notification)
    const job = await notificationQueue.add('send-notification', {
      eventType: 'TEST_NOTIFICATION',
      recipientIds: [], // No in-app notifications
      title: 'Test Notification',
      message: 'Redis + Bull queue test',
      metadata: { test: true },
      emailSubject: 'Queue Test Email',
      emailHtml: '<h1>Success!</h1><p>Redis + Bull queue is working</p>'
    });

    res.json({ 
      success: true, 
      message: 'Test notification queued successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get queue stats
router.get('/queue-stats', async (req, res) => {
  try {
    // Test Redis connection first
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return res.status(500).json({ error: 'REDIS_URL not configured' });
    }

    // Try to get queue stats with timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    );

    const statsPromise = Promise.all([
      notificationQueue.getWaiting(),
      notificationQueue.getActive(), 
      notificationQueue.getCompleted(),
      notificationQueue.getFailed()
    ]);

    const [waiting, active, completed, failed] = await Promise.race([statsPromise, timeout]) as [any[], any[], any[], any[]];

    res.json({
      status: 'connected',
      redisUrl: redisUrl.substring(0, 20) + '...', // Hide full URL
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'missing'
    });
  }
});

export default router;