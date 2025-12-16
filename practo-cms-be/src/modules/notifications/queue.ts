/**
 * Notification Queue Setup
 * 
 * Bull queue configuration for background notification processing
 */

import Bull from 'bull';
import Redis from 'ioredis';

// Redis connection configuration
const redisConfig: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Support both REDIS_URL and individual config
if (process.env.REDIS_URL) {
  redisConfig.host = undefined;
  redisConfig.port = undefined;
  redisConfig.password = undefined;
} else {
  redisConfig.host = process.env.REDIS_HOST || 'localhost';
  redisConfig.port = parseInt(process.env.REDIS_PORT || '6379');
  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }
}

// Create notification queue
export const notificationQueue = new Bull('notifications', {
  redis: process.env.REDIS_URL || redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Queue event handlers (for monitoring)
notificationQueue.on('completed', (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job.id} failed:`, err.message);
});

notificationQueue.on('stalled', (job) => {
  console.warn(`⚠️ Notification job ${job.id} stalled`);
});

export default notificationQueue;

