import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import Redis from 'ioredis';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: string;
  trace?: string;
  [key: string]: any;
}

@Injectable()
export class RedisLoggerService implements NestLoggerService {
  private redis: Redis;
  private serviceName: string;
  private readonly LOG_CHANNEL = 'app:logs';
  private readonly LOG_KEY_PREFIX = 'logs:';
  private readonly MAX_LOGS = 1000; // Keep last 1000 logs per service

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || 'redis_password';

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      console.error('Redis Logger Connection Error:', err);
    });

    this.redis.on('connect', () => {
      console.log(`✅ Redis Logger connected for service: ${serviceName}`);
    });
  }

  private async publishLog(entry: LogEntry): Promise<void> {
    try {
      const logString = JSON.stringify(entry);
      
      // Publish to channel for real-time monitoring
      await this.redis.publish(this.LOG_CHANNEL, logString);
      
      // Store in list for persistence (with max limit)
      const key = `${this.LOG_KEY_PREFIX}${this.serviceName}`;
      await this.redis.lpush(key, logString);
      await this.redis.ltrim(key, 0, this.MAX_LOGS - 1);
      
      // Set expiry on the log key (7 days)
      await this.redis.expire(key, 7 * 24 * 60 * 60);
    } catch (error) {
      // Fallback to console if Redis fails
      console.error('Failed to publish log to Redis:', error);
      console.log(entry);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      context,
      trace,
    };
  }

  log(message: any, context?: string): void {
    const entry = this.createLogEntry('log', message, context);
    this.publishLog(entry);
    console.log(`[${this.serviceName}] ${message}`, context || '');
  }

  error(message: any, trace?: string, context?: string): void {
    const entry = this.createLogEntry('error', message, context, trace);
    this.publishLog(entry);
    console.error(`[${this.serviceName}] ${message}`, trace || '', context || '');
  }

  warn(message: any, context?: string): void {
    const entry = this.createLogEntry('warn', message, context);
    this.publishLog(entry);
    console.warn(`[${this.serviceName}] ${message}`, context || '');
  }

  debug(message: any, context?: string): void {
    const entry = this.createLogEntry('debug', message, context);
    this.publishLog(entry);
    console.debug(`[${this.serviceName}] ${message}`, context || '');
  }

  verbose(message: any, context?: string): void {
    const entry = this.createLogEntry('verbose', message, context);
    this.publishLog(entry);
    console.log(`[${this.serviceName}] VERBOSE: ${message}`, context || '');
  }

  async getLogs(limit: number = 100): Promise<LogEntry[]> {
    try {
      const key = `${this.LOG_KEY_PREFIX}${this.serviceName}`;
      const logs = await this.redis.lrange(key, 0, limit - 1);
      return logs.map(log => JSON.parse(log));
    } catch (error) {
      console.error('Failed to retrieve logs from Redis:', error);
      return [];
    }
  }

  async getLogsByService(serviceName: string, limit: number = 100): Promise<LogEntry[]> {
    try {
      const key = `${this.LOG_KEY_PREFIX}${serviceName}`;
      const logs = await this.redis.lrange(key, 0, limit - 1);
      return logs.map(log => JSON.parse(log));
    } catch (error) {
      console.error(`Failed to retrieve logs for ${serviceName}:`, error);
      return [];
    }
  }

  async getAllServicesLogs(limit: number = 100): Promise<{ [service: string]: LogEntry[] }> {
    try {
      const keys = await this.redis.keys(`${this.LOG_KEY_PREFIX}*`);
      const result: { [service: string]: LogEntry[] } = {};

      for (const key of keys) {
        const serviceName = key.replace(this.LOG_KEY_PREFIX, '');
        const logs = await this.redis.lrange(key, 0, limit - 1);
        result[serviceName] = logs.map(log => JSON.parse(log));
      }

      return result;
    } catch (error) {
      console.error('Failed to retrieve all services logs:', error);
      return {};
    }
  }

  async clearLogs(): Promise<void> {
    try {
      const key = `${this.LOG_KEY_PREFIX}${this.serviceName}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
