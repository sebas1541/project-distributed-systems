import { Controller, Post, Body, Get, UseGuards, Request, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    const authUrl = this.authService.getGoogleAuthUrl();
    res.redirect(authUrl);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin(code);
      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      res.redirect('http://localhost:3000/login?error=google_auth_failed');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.validateToken(req.user.userId);
  }
}
