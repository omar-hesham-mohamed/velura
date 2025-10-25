// src/auth/auth.controller.ts
import { Body, Controller, Post, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guards';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';

class RegisterDto {
  email: string;
  password: string;
  name: string;
}

class LoginDto {
  email: string;
  password: string;
}

class RefreshTokenDto {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user; // from GoogleStrategy.validate
    const tokens = await this.authService.handleOAuthLogin(user);
    res.redirect(`http://localhost:3000?accessToken=${tokens.accessToken}`);
  }

  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookLogin(): Promise<void> {
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookLoginRedirect(@Req() req: Request & { user?: any }) { // We might need to do something about all the as anys
    return {
      message: 'Facebook login successful',
      user: req.user, 
    };
  }
}
