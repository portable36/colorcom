import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    this.client = createClient({ url: redisUrl });

    this.client.on('error', (err) => {
      this.logger.error(`Redis Client Error: ${err?.message || err}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      this.logger.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Failed to connect to Redis: ${(err as any)?.message || err}`);
      // Don't block startup if Redis is unavailable; cache is optional
    }
  }

  async onModuleDestroy() {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
    } catch (err) {
      this.logger.error(`Failed to disconnect from Redis: ${(err as any)?.message || err}`);
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any> {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.get(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (err) {
      this.logger.error(`Failed to get cache key ${key}: ${(err as any)?.message || err}`);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      const ttlOption = ttl ? { EX: ttl } : {};
      await this.client.set(key, JSON.stringify(value), ttlOption);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    } catch (err) {
      this.logger.error(`Failed to set cache key ${key}: ${(err as any)?.message || err}`);
    }
  }

  /**
   * Delete single cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (err) {
      this.logger.error(`Failed to delete cache key ${key}: ${(err as any)?.message || err}`);
    }
  }

  /**
   * Delete multiple cache keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug(`Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (err) {
      this.logger.error(`Failed to delete cache pattern ${pattern}: ${(err as any)?.message || err}`);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.flushDb();
      this.logger.log('Cache cleared');
    } catch (err) {
      this.logger.error(`Failed to clear cache: ${(err as any)?.message || err}`);
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
