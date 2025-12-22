/**
 * Notification Queue Setup
 * 
 * Bull queue configuration for background notification processing
 */

import Bull from 'bull';
import Redis from 'ioredis';

// Redis connection configuration for Upstash
const redisConfig: any = {
  maxRetriesPerRequest: 20, // Increase retries for Upstash
  enableReadyCheck: false,
  connectTimeout: 60000, // 60 seconds for Upstash
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  lazyConnect: false, // Connect immediately
  // Upstash TLS configuration
  tls: {
    rejectUnauthorized: false,
    servername: 'relative-cub-24032.upstash.io'
  },
  family: 4, // IPv4 only
  keepAlive: 30000,
  db: 0,
};

// Use consistent Redis config for both queue and worker
const redisConnectionConfig = {
  port: 6379,
  host: 'relative-cub-24032.upstash.io',
  password: 'AV3gAAIncDFmZDMxM2E1YTYyMDI0MDA2OTk5MjhhYmYwNTg5ODhjMnAxMjQwMzI',
  tls: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
  lazyConnect: false, // Connect immediately
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100
};

// Create notification queue with consistent Redis config
export const notificationQueue = new Bull('notifications', {
  redis: redisConnectionConfig,
  settings: {
    stalledInterval: 30 * 1000, // 30 seconds
    maxStalledCount: 1,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
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

