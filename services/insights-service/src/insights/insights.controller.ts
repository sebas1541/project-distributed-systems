import { Controller, Get, Param, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { InsightsService } from './insights.service';

@Controller()
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

  @Get('stream/:userId')
  async streamInsights(@Param('userId') userId: string, @Res() res: Response) {
    try {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      await this.insightsService.streamInsights(userId, res);
    } catch (error) {
      this.logger.error('Error streaming insights:', error);
      res.write(`data: ${JSON.stringify({ error: 'Failed to stream insights' })}\n\n`);
      res.end();
    }
  }
}
