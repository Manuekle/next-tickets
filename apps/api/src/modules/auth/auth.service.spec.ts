import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn(),
  };

  const mockMailerService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.register({ email: 'test@test.com', password: 'Test1234!', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      const userResponse = { id: '1', email: 'test@test.com', name: 'Test', role: 'CUSTOMER', avatarUrl: null, isActive: true, createdAt: new Date() };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(userResponse);
      mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'test@test.com', name: 'Test', role: 'CUSTOMER' });

      const result = await service.register({ email: 'test@test.com', password: 'Test1234!', name: 'Test' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for wrong credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test1234!', 12);
      const userResponse = { id: '1', email: 'test@test.com', name: 'Test', role: 'CUSTOMER', avatarUrl: null, isActive: true, createdAt: new Date() };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: '1', email: 'test@test.com', passwordHash: hashedPassword, name: 'Test', role: 'CUSTOMER' })
        .mockResolvedValue(userResponse);

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
