import { Controller, Post, Body, Get, UseGuards, Req, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../../domain/dto/login.dto';
import { RegisterDto } from '../../domain/dto/register.dto';
import { RefreshTokenDto } from '../../domain/dto/refresh-token.dto';
import { SocialLoginDto } from '../../domain/dto/social-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() input: RegisterDto, @Req() req: any) {
    const meta = {
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
      deviceId: req.body?.deviceId || req.headers['x-device-id'] || null,
      deviceName: req.body?.deviceName || null,
      tenantId: req.tenantId || null,
    };

    return this.authService.register(input, meta);
  }

  @Post('login')
  async login(@Body() input: LoginDto, @Req() req: any) {
    const meta = {
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
      deviceId: req.body?.deviceId || req.headers['x-device-id'] || null,
      deviceName: req.body?.deviceName || req.headers['x-device-name'] || null,
      tenantId: req.tenantId || null,
    };

    return this.authService.login(input, meta);
  }

  @Post('refresh')
  async refresh(@Body() input: RefreshTokenDto) {
    return this.authService.refreshToken(input);
  }

  @Post('social')
  async social(@Body() input: SocialLoginDto, @Req() req: any) {
    const meta = {
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
      deviceId: input.deviceId || req.headers['x-device-id'] || null,
      deviceName: input.deviceName || req.headers['x-device-name'] || null,
      tenantId: req.tenantId || null,
    };

    return this.authService.socialLogin(input.provider, input.accessToken, meta);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async listSessions(@Req() req: any) {
    return this.authService.getSessions(req.user.id);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(AuthGuard('jwt'))
  async revokeSession(@Req() req: any, @Param('id') id: string) {
    return this.authService.revokeSession(req.user.id, id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req: any) {
    return req.user;
  }

  @Get('health')
  async health() {
    return { status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() };
  }
}
