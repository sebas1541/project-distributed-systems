import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost/api/auth/google/callback',
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });
  }

  async getUserInfo(code: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    return {
      googleId: data.id,
      email: data.email,
      firstName: data.given_name || '',
      lastName: data.family_name || '',
      picture: data.picture || '',
    };
  }
}
