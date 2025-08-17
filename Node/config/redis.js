import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Create Redis client with configuration
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('❌ Redis server refused the connection');
            return new Error('Redis server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('❌ Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('❌ Redis retry attempts exhausted');
            return undefined;
          }
          // Reconnect after this time
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Handle Redis events
      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis Client Disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      console.log('🚀 Redis connection established successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        console.log('🔌 Redis disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error.message);
    }
  }

  // Check if Redis is available
  isAvailable() {
    return this.client && this.isConnected;
  }

  // Get data from cache
  async get(key) {
    try {
      if (!this.isAvailable()) {
        console.warn('⚠️ Redis not available for GET operation');
        return null;
      }

      const data = await this.client.get(key);
      if (data) {
        console.log(`📥 Cache HIT for key: ${key}`);
        return JSON.parse(data);
      } else {
        console.log(`📭 Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  // Set data in cache with optional TTL
  async set(key, value, ttlSeconds = 300) {
    try {
      if (!this.isAvailable()) {
        console.warn('⚠️ Redis not available for SET operation');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedValue);
      console.log(`📤 Cache SET for key: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  // Delete specific key
  async del(key) {
    try {
      if (!this.isAvailable()) {
        console.warn('⚠️ Redis not available for DEL operation');
        return false;
      }

      const result = await this.client.del(key);
      console.log(`🗑️ Cache DEL for key: ${key} (${result} keys deleted)`);
      return result > 0;
    } catch (error) {
      console.error(`❌ Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  // Delete keys by pattern
  async delPattern(pattern) {
    try {
      if (!this.isAvailable()) {
        console.warn('⚠️ Redis not available for pattern deletion');
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        console.log(`🗑️ Cache pattern DEL: ${pattern} (${result} keys deleted)`);
        return result;
      }
      return 0;
    } catch (error) {
      console.error(`❌ Redis pattern DEL error for pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  // Clear all cache (use with caution)
  async flushAll() {
    try {
      if (!this.isAvailable()) {
        console.warn('⚠️ Redis not available for FLUSH operation');
        return false;
      }

      await this.client.flushAll();
      console.log('🧹 All Redis cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Redis FLUSH error:', error.message);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.isAvailable()) {
        return { available: false, error: 'Redis not connected' };
      }

      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        available: true,
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('❌ Redis stats error:', error.message);
      return { available: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const redisService = new RedisService();

export default redisService; 