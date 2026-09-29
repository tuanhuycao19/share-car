import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_ENV, AppEnv } from '../config/env';

/**
 * Redis dùng cho dữ liệu tạm thời (rate limit đăng nhập, cache...).
 * Thiết kế "fail-open": nếu Redis lỗi thì bỏ qua tính năng phụ, không làm hỏng nghiệp vụ chính.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(@Inject(APP_ENV) env: AppEnv) {
    this.client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: true,
    });
    this.client.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
  }

  /** Tăng bộ đếm có TTL, trả về giá trị mới (hoặc null nếu Redis không khả dụng). */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    try {
      const [[, count]] = (await this.client
        .multi()
        .incr(key)
        .expire(key, ttlSeconds, 'NX')
        .exec()) as [[Error | null, number]];
      return count;
    } catch {
      return null;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      /* fail-open */
    }
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }
}
