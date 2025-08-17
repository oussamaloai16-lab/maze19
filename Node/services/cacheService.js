import redisService from '../config/redis.js';
import crypto from 'crypto';

class CacheService {
  constructor() {
    this.prefix = 'suggested_clients:';
    this.defaultTTL = 300; // 5 minutes
    this.statsTTL = 180; // 3 minutes for statistics
    this.listTTL = 300; // 5 minutes for client lists
  }

  // Generate cache key based on filters and pagination
  generateCacheKey(page, limit, filters, type = 'list') {
    const filterString = JSON.stringify(filters) || '{}';
    const hash = crypto.createHash('md5').update(filterString).digest('hex');
    return `${this.prefix}${type}:p${page}_l${limit}_f${hash}`;
  }

  // Generate statistics cache key
  generateStatsKey(filters = {}) {
    const filterString = JSON.stringify(filters) || '{}';
    const hash = crypto.createHash('md5').update(filterString).digest('hex');
    return `${this.prefix}stats:f${hash}`;
  }

  // Get cached suggested clients list
  async getCachedClients(page, limit, filters) {
    try {
      const key = this.generateCacheKey(page, limit, filters, 'list');
      const cached = await redisService.get(key);
      
      if (cached) {
        console.log(`🎯 Cache HIT for clients list: page=${page}, limit=${limit}`);
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
      
      console.log(`💨 Cache MISS for clients list: page=${page}, limit=${limit}`);
      return {
        success: false,
        fromCache: false
      };
    } catch (error) {
      console.error('❌ Error getting cached clients:', error.message);
      return { success: false, fromCache: false };
    }
  }

  // Cache suggested clients list
  async setCachedClients(page, limit, filters, data) {
    try {
      const key = this.generateCacheKey(page, limit, filters, 'list');
      const success = await redisService.set(key, data, this.listTTL);
      
      if (success) {
        console.log(`💾 Cached clients list: page=${page}, limit=${limit}, TTL=${this.listTTL}s`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error caching clients:', error.message);
      return false;
    }
  }

  // Get cached statistics
  async getCachedStats(filters) {
    try {
      const key = this.generateStatsKey(filters);
      const cached = await redisService.get(key);
      
      if (cached) {
        console.log(`📊 Cache HIT for statistics`);
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
      
      console.log(`📈 Cache MISS for statistics`);
      return {
        success: false,
        fromCache: false
      };
    } catch (error) {
      console.error('❌ Error getting cached stats:', error.message);
      return { success: false, fromCache: false };
    }
  }

  // Cache statistics
  async setCachedStats(filters, stats) {
    try {
      const key = this.generateStatsKey(filters);
      const success = await redisService.set(key, stats, this.statsTTL);
      
      if (success) {
        console.log(`📊 Cached statistics: TTL=${this.statsTTL}s`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error caching stats:', error.message);
      return false;
    }
  }

  // Get cached individual client
  async getCachedClient(clientId) {
    try {
      const key = `${this.prefix}client:${clientId}`;
      const cached = await redisService.get(key);
      
      if (cached) {
        console.log(`👤 Cache HIT for client: ${clientId}`);
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
      
      console.log(`👤 Cache MISS for client: ${clientId}`);
      return {
        success: false,
        fromCache: false
      };
    } catch (error) {
      console.error('❌ Error getting cached client:', error.message);
      return { success: false, fromCache: false };
    }
  }

  // Cache individual client
  async setCachedClient(clientId, clientData) {
    try {
      const key = `${this.prefix}client:${clientId}`;
      const success = await redisService.set(key, clientData, this.defaultTTL);
      
      if (success) {
        console.log(`👤 Cached client: ${clientId}, TTL=${this.defaultTTL}s`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error caching client:', error.message);
      return false;
    }
  }

  // Invalidate all suggested clients cache
  async invalidateAllClients() {
    try {
      const patterns = [
        `${this.prefix}list:*`,
        `${this.prefix}stats:*`,
        `${this.prefix}client:*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await redisService.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`🧹 Invalidated ${totalDeleted} suggested clients cache entries`);
      return totalDeleted;
    } catch (error) {
      console.error('❌ Error invalidating clients cache:', error.message);
      return 0;
    }
  }

  // Invalidate specific client cache
  async invalidateClient(clientId) {
    try {
      const key = `${this.prefix}client:${clientId}`;
      const success = await redisService.del(key);
      
      if (success) {
        console.log(`🗑️ Invalidated cache for client: ${clientId}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error invalidating client cache:', error.message);
      return false;
    }
  }

  // Invalidate lists and stats (when data changes)
  async invalidateListsAndStats() {
    try {
      const patterns = [
        `${this.prefix}list:*`,
        `${this.prefix}stats:*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await redisService.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`🧹 Invalidated ${totalDeleted} list and stats cache entries`);
      return totalDeleted;
    } catch (error) {
      console.error('❌ Error invalidating lists and stats cache:', error.message);
      return 0;
    }
  }

  // Get cache usage statistics
  async getCacheStats() {
    try {
      const redisStats = await redisService.getStats();
      
      if (!redisStats.available) {
        return {
          available: false,
          error: redisStats.error
        };
      }
      
      // Get count of suggested clients cache keys
      const patterns = [
        `${this.prefix}list:*`,
        `${this.prefix}stats:*`,
        `${this.prefix}client:*`
      ];
      
      const counts = {};
      for (const pattern of patterns) {
        const keys = await redisService.client.keys(pattern);
        const type = pattern.split(':')[1].replace('*', '');
        counts[type] = keys.length;
      }
      
      return {
        available: true,
        redis: redisStats,
        suggestedClients: {
          listCaches: counts.list || 0,
          statsCaches: counts.stats || 0,
          clientCaches: counts.client || 0,
          totalCaches: Object.values(counts).reduce((sum, count) => sum + count, 0)
        },
        ttl: {
          defaultTTL: this.defaultTTL,
          statsTTL: this.statsTTL,
          listTTL: this.listTTL
        }
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error.message);
      return {
        available: false,
        error: error.message
      };
    }
  }

  // Warm up cache with most common queries
  async warmUpCache() {
    try {
      console.log('🔥 Starting cache warm-up for suggested clients...');
      
      // Common filter combinations to pre-cache
      const commonQueries = [
        { page: 1, limit: 25, filters: {} }, // Default view
        { page: 1, limit: 25, filters: { status: 'pending' } },
        { page: 1, limit: 25, filters: { status: 'contacted' } },
        { page: 1, limit: 25, filters: { status: 'interested' } },
        { page: 1, limit: 25, filters: { wilaya: 'Tipaza' } },
        { page: 1, limit: 25, filters: { wilaya: 'Alger' } },
        { page: 1, limit: 25, filters: { wilaya: 'Blida' } },
        { page: 1, limit: 25, filters: { wilaya: 'Boumerdes' } },
        { page: 1, limit: 25, filters: { scoreRange: 'low' } },
        { page: 1, limit: 25, filters: { scoreRange: 'medium' } },
        { page: 1, limit: 25, filters: { scoreRange: 'high' } }
      ];
      
      console.log(`🎯 Pre-caching ${commonQueries.length} common queries...`);
      
      // Note: This would need to be called from the service that has access to the actual data
      // For now, just log the intention
      return commonQueries;
    } catch (error) {
      console.error('❌ Error warming up cache:', error.message);
      return [];
    }
  }

  // Clean expired cache entries (maintenance function)
  async cleanExpiredCache() {
    try {
      console.log('🧽 Cleaning expired cache entries...');
      
      // Redis automatically handles TTL expiration, but we can manually check and clean
      // This is more of a maintenance/reporting function
      
      const patterns = [
        `${this.prefix}list:*`,
        `${this.prefix}stats:*`,
        `${this.prefix}client:*`
      ];
      
      let totalKeys = 0;
      for (const pattern of patterns) {
        const keys = await redisService.client.keys(pattern);
        totalKeys += keys.length;
      }
      
      console.log(`🔍 Found ${totalKeys} total cache keys`);
      return totalKeys;
    } catch (error) {
      console.error('❌ Error cleaning cache:', error.message);
      return 0;
    }
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

export default cacheService; 