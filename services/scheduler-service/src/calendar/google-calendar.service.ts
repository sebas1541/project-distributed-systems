import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCalendarToken } from '../entities/user-calendar-token.entity';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private oauth2Client: OAuth2Client;

  constructor(
    @InjectRepository(UserCalendarToken)
    private tokenRepository: Repository<UserCalendarToken>,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost/api/scheduler/auth/google/callback',
    );
  }

  getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      state: userId, // Pass userId in state parameter
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600000);

    await this.tokenRepository.save({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      calendarId: 'primary',
    });

    this.logger.log(`User ${userId} connected to Google Calendar`);
  }

  async getAuthenticatedClient(userId: string): Promise<OAuth2Client | null> {
    const tokenData = await this.tokenRepository.findOne({ where: { userId } });
    
    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    if (new Date() >= tokenData.expiresAt) {
      this.oauth2Client.setCredentials({
        refresh_token: tokenData.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      tokenData.accessToken = credentials.access_token;
      tokenData.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
      
      if (credentials.refresh_token) {
        tokenData.refreshToken = credentials.refresh_token;
      }

      await this.tokenRepository.save(tokenData);
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
    });

    return client;
  }

  async createEvent(
    userId: string,
    title: string,
    description: string,
    dueDate: Date,
  ): Promise<string | null> {
    const auth = await this.getAuthenticatedClient(userId);
    
    if (!auth) {
      this.logger.warn(`No calendar connection for user ${userId}`);
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'UTC',
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      this.logger.log(`Created event ${response.data.id} for user ${userId}`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`Failed to create event for user ${userId}:`, error.message);
      return null;
    }
  }

  async updateEvent(
    userId: string,
    googleEventId: string,
    title: string,
    description: string,
    dueDate: Date,
  ): Promise<boolean> {
    const auth = await this.getAuthenticatedClient(userId);
    
    if (!auth) {
      return false;
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
    };

    try {
      await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        requestBody: event,
      });

      this.logger.log(`Updated event ${googleEventId} for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update event ${googleEventId}:`, error.message);
      return false;
    }
  }

  async deleteEvent(userId: string, googleEventId: string): Promise<boolean> {
    const auth = await this.getAuthenticatedClient(userId);
    
    if (!auth) {
      return false;
    }

    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      this.logger.log(`Deleted event ${googleEventId} for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete event ${googleEventId}:`, error.message);
      return false;
    }
  }

  async disconnectCalendar(userId: string): Promise<void> {
    await this.tokenRepository.delete({ userId });
    this.logger.log(`User ${userId} disconnected from Google Calendar`);
  }

  async isConnected(userId: string): Promise<boolean> {
    const tokenData = await this.tokenRepository.findOne({ where: { userId } });
    return !!tokenData;
  }
}
