import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserType } from './user-type.enum';
import { RiderService } from '../entities/rider/rider.service';
import { DriverService } from '../entities/driver/driver.service';
import { AdminService } from '../entities/admin/admin.service';
import { PasswordService } from '../entities/common/password.service';
import { UserService } from '../entities/user/user.service';
import { AdminRole } from '../entities/admin/admin-role.model';

describe('AuthService', () => {
  let authService: AuthService;

  const mockJwtService = { sign: jest.fn() };
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
        { provide: JwtService, useValue: mockJwtService },
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
    it('looks up only the users table and signs a token', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'jane@example.com',
        password: 'hashed-password',
        role: 'rider',
      });
      mockPasswordService.verify.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await authService.login({
        email: 'jane@example.com',
        password: 'secret123',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'jane@example.com',
        true,
      );
      expect(mockRiderService.createRider).not.toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-uuid-1',
          email: 'jane@example.com',
          role: 'rider',
        },
        { expiresIn: '10m' },
      );
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nobody@example.com',
          password: 'secret123',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
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
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('registers a rider', async () => {
      mockRiderService.createRider.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'jane@example.com',
      });

      const rider = await authService.register(UserType.RIDER, {
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

      const driver = await authService.register(UserType.DRIVER, {
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

    it('rejects public admin registration', async () => {
      await expect(
        authService.register(UserType.ADMIN, {
          email: 'boss@example.com',
          password: 'Secret123!',
          role: AdminRole.ADMIN,
          firstName: 'Boss',
          lastName: 'Admin',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockAdminService.createAdmin).not.toHaveBeenCalled();
    });

    it('propagates ConflictException when the email is already registered', async () => {
      mockRiderService.createRider.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        authService.register(UserType.RIDER, {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+8801711111111',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when required fields are missing', async () => {
      await expect(
        authService.register(UserType.RIDER, {} as never),
      ).rejects.toThrow(BadRequestException);
      expect(mockRiderService.createRider).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the body contains unknown fields', async () => {
      await expect(
        authService.register(UserType.RIDER, {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+8801711111111',
          hackerField: true,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an unknown userType', async () => {
      await expect(
        authService.register('robot' as UserType, {} as never),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
