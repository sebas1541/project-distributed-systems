import { Controller, Get, Query } from '@nestjs/common';
import { RedisLoggerService } from './redis-logger.service';

@Controller('logs')
export class LogsController {
  private loggerService: RedisLoggerService;

  constructor() {
    // Create a logger instance just for retrieving logs (not for logging)
    this.loggerService = new RedisLoggerService('log-viewer');
  }

  @Get()
  async getLogs(
    @Query('service') service?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;

    if (service) {
      const logs = await this.loggerService.getLogsByService(service, limitNum);
      return {
        service,
        count: logs.length,
        logs,
      };
    }

    const allLogs = await this.loggerService.getAllServicesLogs(limitNum);
    return {
      services: Object.keys(allLogs),
      logs: allLogs,
    };
  }

  @Get('services')
  async getServices() {
    const allLogs = await this.loggerService.getAllServicesLogs(1);
    return {
      services: Object.keys(allLogs),
    };
  }
}
