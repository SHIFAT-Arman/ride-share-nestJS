import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { RiderService } from '../entities/rider/rider.service';
import { DriverService } from '../entities/driver/driver.service';
import { AdminService } from '../entities/admin/admin.service';
import { PasswordService } from '../entities/common/password.service';
import { UserService } from '../entities/user/user.service';
import { TokenPairService } from './token-pair.service';

describe('AuthService', () => {
  let authService: AuthService;

  const mockTokenPairs = {
    issue: jest.fn(),
    rotate: jest.fn(),
    revokeRawRefreshToken: jest.fn(),
    accessMaxAgeMs: jest.fn().mockReturnValue(900000),
    refreshMaxAgeMs: jest.fn().mockReturnValue(604800000),
  };
  const mockPasswordService = { verify: jest.fn() };
  const mockUserService = { findByEmail: jest.fn() };
  const mockRiderService = { createRider: jest.fn() };
  const mockDriverService = { createDriver: jest.fn() };
  const mockAdminService = { createAdmin: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TokenPairService, useValue: mockTokenPairs },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: UserService, useValue: mockUserService },
        { provide: RiderService, useValue: mockRiderService },
        { provide: DriverService, useValue: mockDriverService },
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('looks up only the users table and issues a token pair', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'jane@example.com',
        password: 'hashed-password',
        role: 'rider',
      });
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenPairs.issue.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        role: 'rider',
        sub: 'user-uuid-1',
        email: 'jane@example.com',
      });

      const result = await authService.login({
        email: 'jane@example.com',
        password: 'secret123',
      });

      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
        role: 'rider',
        sub: 'user-uuid-1',
        email: 'jane@example.com',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'jane@example.com',
        true,
      );
      expect(mockTokenPairs.issue).toHaveBeenCalled();
      expect(mockRiderService.createRider).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nobody@example.com',
          password: 'secret123',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockTokenPairs.issue).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'jane@example.com',
        password: 'hashed-password',
        role: 'rider',
      });
      mockPasswordService.verify.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockTokenPairs.issue).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('registers a rider', async () => {
      mockRiderService.createRider.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'jane@example.com',
      });

      const rider = await authService.registerRider({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'secret123',
        phone: '+8801711111111',
      });

      expect(rider).toEqual({ id: 'user-uuid-1', email: 'jane@example.com' });
      expect(mockRiderService.createRider).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
          firstName: 'Jane',
        }),
      );
    });

    it('registers a driver', async () => {
      mockDriverService.createDriver.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'john@example.com',
      });

      const driver = await authService.registerDriver({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        password: 'Secret@123',
        phone: '01700000000',
      });

      expect(driver).toEqual({
        id: 'user-uuid-1',
        email: 'john@example.com',
      });
    });

    it('registers an admin', async () => {
      mockAdminService.createAdmin.mockResolvedValue({
        id: 'user-uuid-2',
        email: 'boss@example.com',
      });

      const admin = await authService.registerAdmin({
        email: 'boss@example.com',
        password: 'Secret123!',
        firstName: 'Boss',
        lastName: 'Admin',
      });

      expect(admin).toEqual({
        id: 'user-uuid-2',
        email: 'boss@example.com',
      });
      expect(mockAdminService.createAdmin).toHaveBeenCalled();
    });

    it('propagates ConflictException when the email is already registered', async () => {
      mockRiderService.createRider.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        authService.registerRider({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+8801711111111',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when required fields are missing', async () => {
      await expect(authService.registerRider({} as never)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRiderService.createRider).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the body contains unknown fields', async () => {
      await expect(
        authService.registerRider({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+8801711111111',
          hackerField: true,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
