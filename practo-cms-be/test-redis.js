// Quick Redis connection test
import Redis from 'ioredis';

const redisUrl = "rediss://default:AV3gAAIncDFmZDMxM2E1YTYyMDI0MDA2OTk5MjhhYmYwNTg5ODhjMnAxMjQwMzI@relative-cub-24032.upstash.io:6379";

console.log('🔍 Testing Upstash Redis connection...');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection failed:', err.message);
});

// Test basic operations
try {
  await redis.set('test-key', 'test-value');
  const value = await redis.get('test-key');
  console.log('✅ Redis read/write test:', value === 'test-value' ? 'PASSED' : 'FAILED');
  await redis.del('test-key');
  redis.disconnect();
} catch (error) {
  console.error('❌ Redis operation failed:', error.message);
  process.exit(1);
}