import { Controller, Get, Query, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { GoogleCalendarService } from '../calendar/google-calendar.service';

@Controller('auth/google')
export class AuthController {
  constructor(private calendarService: GoogleCalendarService) {}

  @Get('connect')
  connect(@Query('userId') userId: string, @Res() res: Response) {
    // Pass userId in state parameter for OAuth callback
    const authUrl = this.calendarService.getAuthUrl(userId || '1');
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') userIdFromState: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    try {
      // Use userId from state parameter
      const userId = userIdFromState || '1';
      
      await this.calendarService.handleCallback(code, userId);
      
      // Redirect to frontend success page
      res.redirect('http://localhost:3000/settings?calendar=connected');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('http://localhost:3000/settings?calendar=error');
    }
  }

  @Get('status')
  async status(@Headers('x-user-id') userId: string) {
    const connected = await this.calendarService.isConnected(userId);
    return { connected };
  }

  @Get('disconnect')
  async disconnect(@Headers('x-user-id') userId: string) {
    await this.calendarService.disconnectCalendar(userId);
    return { success: true };
  }
}
