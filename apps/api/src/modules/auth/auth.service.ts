import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });
    const verifyToken = this.jwtService.sign(
      { sub: user.id, type: 'email-verify' },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '24h' },
    );
    await this.mailerService.sendVerificationEmail(user.email, verifyToken).catch(() => {});
    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({ where: { userId, token: refreshToken } });
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      });
      const session = await this.prisma.session.findUnique({ where: { token: refreshToken } });
      if (!session) throw new UnauthorizedException('Invalid refresh token');
      await this.prisma.session.delete({ where: { id: session.id } });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };
    const token = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '1h' },
    );
    await this.mailerService.sendPasswordReset(email, token).catch(() => {});
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
      });
      if (payload.type !== 'password-reset') throw new Error('Invalid token type');
      const passwordHash = await bcrypt.hash(password, 12);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });
      await this.prisma.session.deleteMany({ where: { userId: payload.sub } });
      return { message: 'Password updated successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
      });
      if (payload.type !== 'email-verify') throw new Error('Invalid token type');
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: true },
      });
      return { message: 'Email verified successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }

  async updateMe(userId: string, dto: { name?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
    });
    return user;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({ data: { userId, token: refreshToken, expiresAt } });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
    });
    return { accessToken, refreshToken, user };
  }
}
