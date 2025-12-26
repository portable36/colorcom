import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoginDto } from '../../domain/dto/login.dto';
import { RegisterDto } from '../../domain/dto/register.dto';
import { RefreshTokenDto } from '../../domain/dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // meta: optional device/session/tenant information
  async register(input: RegisterDto, meta?: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username || input.email.split('@')[0],
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    return this.generateTokens(user.id, user.email, meta);
  }

  async login(input: LoginDto, meta?: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return this.generateTokens(user.id, user.email, meta);
  }

  async refreshToken(input: RefreshTokenDto) {
    const refreshRecord = await this.prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { session: true },
    });

    if (!refreshRecord || refreshRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (refreshRecord.session?.revoked) {
      throw new UnauthorizedException('Session revoked');
    }

    // rotate: remove the used refresh token and issue a new one tied to same session
    await this.prisma.refreshToken.delete({ where: { id: refreshRecord.id } });

    const meta = {
      ip: refreshRecord.session?.ipAddress || null,
      userAgent: refreshRecord.session?.userAgent || null,
      deviceId: refreshRecord.session?.deviceId || null,
      deviceName: refreshRecord.session?.deviceName || null,
      tenantId: null,
      sessionId: refreshRecord.sessionId,
    };

    return this.generateTokens(refreshRecord.userId, '', meta);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.updateMany({ where: { userId }, data: { revoked: true } });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, meta?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { select: { name: true, permissions: true } },
        tenantAccess: { select: { tenantId: true, role: true } },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const payload = {
      sub: userId,
      email: email || user.email,
      roles: user.roles.map((r) => r.name),
      tenants: user.tenantAccess.map((t) => ({ tenantId: t.tenantId, role: t.role })),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRY as string) || '15m' });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    const refreshToken = await this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });

    // create or update session
    let sessionId: string | undefined = meta?.sessionId;
    if (!sessionId) {
      const session = await this.prisma.session.create({
        data: {
          userId,
          deviceId: meta?.deviceId,
          deviceName: meta?.deviceName,
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        },
      });
      sessionId = session.id;
    } else {
      await this.prisma.session.update({ where: { id: sessionId }, data: { lastSeen: new Date(), revoked: false } });
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        sessionId: sessionId,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRY || '15m',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateJwtPayload(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  // Social login using provider access token (minimal server-side exchange)
  async socialLogin(provider: string, accessToken: string, meta?: any) {
    let profile: any = null;

    if (provider === 'google') {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      profile = res.data;
      // profile.sub, profile.email, profile.name, profile.picture
    } else if (provider === 'facebook') {
      const res = await axios.get('https://graph.facebook.com/me', {
        params: { fields: 'id,name,email,picture', access_token: accessToken },
      });
      profile = res.data;
    } else {
      throw new BadRequestException('Unsupported provider');
    }

    const providerAccountId = profile.sub || profile.id;
    if (!providerAccountId) throw new BadRequestException('Unable to retrieve provider id');

    // find existing oauth account
    let oauth = await this.prisma.oauthAccount.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } }, include: { user: true } }).catch(() => null);

    let user = oauth?.user;
    if (!user) {
      // try find by email
      if (profile.email) {
        user = await this.prisma.user.findUnique({ where: { email: profile.email } }).catch(() => null);
      }
    }

    if (!user) {
      // create user
      const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
      user = await this.prisma.user.create({ data: { email: profile.email || `${providerAccountId}@${provider}.local`, username: (profile.email || providerAccountId).toString().split('@')[0], passwordHash, firstName: profile.given_name || profile.name || undefined, profileImage: profile.picture || undefined, isEmailVerified: !!profile.email } });
    }

    // create oauth account if missing
    if (!oauth) {
      await this.prisma.oauthAccount.create({ data: { userId: user.id, provider, providerAccountId, email: profile.email || null, name: profile.name || null, image: (profile.picture && (profile.picture.data?.url || profile.picture)) || null, accessToken: accessToken } });
    } else {
      await this.prisma.oauthAccount.update({ where: { id: oauth.id }, data: { accessToken } });
    }

    return this.generateTokens(user.id, user.email, meta);
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({ where: { userId }, include: { refreshTokens: true } });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new UnauthorizedException('Session not found');
    await this.prisma.session.update({ where: { id: sessionId }, data: { revoked: true } });
    await this.prisma.refreshToken.deleteMany({ where: { sessionId } });
    return { message: 'Session revoked' };
  }
}
