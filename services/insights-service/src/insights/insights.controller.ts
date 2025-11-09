import { Controller, Get, Param, Logger } from '@nestjs/common';
import { InsightsService } from './insights.service';

@Controller('insights')
export class InsightsController {
  private readonly logger = new Logger(InsightsController.name);

  constructor(private readonly insightsService: InsightsService) {}

  @Get('summary/:userId')
  async getSummary(@Param('userId') userId: string) {
    try {
      const insights = await this.insightsService.generateInsights(userId);
      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      this.logger.error('Error getting insights summary:', error);
      return {
        success: false,
        error: 'Failed to generate insights',
      };
    }
  }

  @Get('analytics/:userId')
  async getAnalytics(@Param('userId') userId: string) {
    try {
      const analytics = await this.insightsService.getAnalytics(userId);
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      return {
        success: false,
        error: 'Failed to get analytics',
      };
    }
  }

  @Get('upcoming/:userId')
  async getUpcoming(@Param('userId') userId: string) {
    try {
      const upcomingTasks = await this.insightsService.getUpcoming(userId);
      return {
        success: true,
        data: upcomingTasks,
      };
    } catch (error) {
      this.logger.error('Error getting upcoming tasks:', error);
      return {
        success: false,
        error: 'Failed to get upcoming tasks',
      };
    }
  }
}
