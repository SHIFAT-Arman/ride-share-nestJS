import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserType } from './user-type.enum';
import { RiderService } from '../entities/rider/rider.service';
import { DriverService } from '../entities/driver/driver.service';
import { AdminService } from '../entities/admin/admin.service';
import { PasswordService } from '../entities/common/password.service';
import { EmailService } from '../entities/admin/email/email.service';
import { AdminRole } from '../entities/admin/admin-role.model';
import { DriverStatus } from '../entities/driver/driver.entity';

describe('AuthService', () => {
  let authService: AuthService;

  // Mocks: pretend versions of the real services. We decide what each method
  // returns, so the test only exercises AuthService's own logic — no database
  // or network involved. The "as unknown as X" casts tell TypeScript to accept
  // the partial mock objects in place of the real services.
  const mockJwtService = { sign: jest.fn() };
  const mockPasswordService = { verify: jest.fn() };
  const mockEmailService = { sendEmail: jest.fn() };
  const mockRiderService = {
    findOneByEmail: jest.fn(),
    createRider: jest.fn(),
  };
  const mockDriverService = {
    findOneByEmail: jest.fn(),
    createDriver: jest.fn(),
  };
  const mockAdminService = {
    findOneByEmail: jest.fn(),
    createAdmin: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService as unknown as JwtService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService as unknown as PasswordService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService as unknown as EmailService,
        },
        {
          provide: RiderService,
          useValue: mockRiderService as unknown as RiderService,
        },
        {
          provide: DriverService,
          useValue: mockDriverService as unknown as DriverService,
        },
        {
          provide: AdminService,
          useValue: mockAdminService as unknown as AdminService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns a signed token for a valid rider with role "rider"', async () => {
      mockRiderService.findOneByEmail.mockResolvedValue({
        id: 'rider-uuid-1',
        email: 'jane@example.com',
        password: 'hashed-password',
      });
      mockPasswordService.verify.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('signed-token');

      const token = await authService.login(
        'jane@example.com',
        'secret123',
        UserType.RIDER,
      );

      expect(token).toBe('signed-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'rider-uuid-1',
        email: 'jane@example.com',
        role: 'rider',
      });
    });

    it('converts the driver numeric id to a string sub and sets role "driver"', async () => {
      mockDriverService.findOneByEmail.mockResolvedValue({
        id: 7,
        email: 'john@example.com',
        password: 'hashed-password',
      });
      mockPasswordService.verify.mockResolvedValue(true);

      await authService.login('john@example.com', 'secret123', UserType.DRIVER);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '7',
        email: 'john@example.com',
        role: 'driver',
      });
    });

    it('uses the admin role from the admin record', async () => {
      mockAdminService.findOneByEmail.mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'boss@example.com',
        password: 'hashed-password',
        role: 'SUPER_ADMIN',
      });
      mockPasswordService.verify.mockResolvedValue(true);

      await authService.login('boss@example.com', 'Secret123!', UserType.ADMIN);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'admin-uuid-1',
        email: 'boss@example.com',
        role: 'SUPER_ADMIN',
      });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      mockRiderService.findOneByEmail.mockResolvedValue(null);

      await expect(
        authService.login('nobody@example.com', 'secret123', UserType.RIDER),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      mockRiderService.findOneByEmail.mockResolvedValue({
        id: 'rider-uuid-1',
        email: 'jane@example.com',
        password: 'hashed-password',
      });
      mockPasswordService.verify.mockResolvedValue(false);

      await expect(
        authService.login('jane@example.com', 'wrong-password', UserType.RIDER),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the userType is unknown', async () => {
      await expect(
        authService.login('jane@example.com', 'secret123', 'robot' as UserType),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRiderService.findOneByEmail).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('registers a rider', async () => {
      mockRiderService.findOneByEmail.mockResolvedValue(null);
      mockRiderService.createRider.mockResolvedValue({
        id: 'rider-uuid-1',
        email: 'jane@example.com',
      });

      const rider = await authService.register(UserType.RIDER, {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'secret123',
        phone: '+8801711111111',
      });

      expect(rider).toEqual({ id: 'rider-uuid-1', email: 'jane@example.com' });
      expect(mockRiderService.createRider).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
          firstName: 'Jane',
        }),
      );
    });

    it('registers a driver', async () => {
      mockDriverService.findOneByEmail.mockResolvedValue(null);
      mockDriverService.createDriver.mockResolvedValue({
        id: 7,
        email: 'john@example.com',
      });

      const driver = await authService.register(UserType.DRIVER, {
        fullName: 'John Smith',
        age: 30,
        email: 'john@example.com',
        password: 'secret123',
        status: DriverStatus.ACTIVE,
      });

      expect(driver).toEqual({ id: 7, email: 'john@example.com' });
    });

    it('registers an admin and sends a welcome email', async () => {
      mockAdminService.findOneByEmail.mockResolvedValue(null);
      mockAdminService.createAdmin.mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'boss@example.com',
        role: 'ADMIN',
        profile: { firstName: 'Boss' },
      });

      const admin = await authService.register(UserType.ADMIN, {
        email: 'boss@example.com',
        password: 'Secret123!',
        role: AdminRole.ADMIN,
        firstName: 'Boss',
        lastName: 'Admin',
      });

      expect(admin).toEqual({
        id: 'admin-uuid-1',
        email: 'boss@example.com',
        role: 'ADMIN',
        profile: { firstName: 'Boss' },
      });
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: ['boss@example.com'],
          subject: 'Welcome!',
        }),
      );
    });

    it('throws ConflictException when the rider email is already registered', async () => {
      mockRiderService.findOneByEmail.mockResolvedValue({
        id: 'existing-rider',
        email: 'jane@example.com',
      });

      await expect(
        authService.register(UserType.RIDER, {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+8801711111111',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockRiderService.createRider).not.toHaveBeenCalled();
    });

    it('does not create an admin or send email when the admin email exists', async () => {
      mockAdminService.findOneByEmail.mockResolvedValue({
        id: 'existing-admin',
        email: 'boss@example.com',
      });

      await expect(
        authService.register(UserType.ADMIN, {
          email: 'boss@example.com',
          password: 'Secret123!',
          role: AdminRole.ADMIN,
          firstName: 'Boss',
          lastName: 'Admin',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockAdminService.createAdmin).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when required fields are missing', async () => {
      await expect(
        authService.register(UserType.RIDER, {} as never),
      ).rejects.toThrow(BadRequestException);
      expect(mockRiderService.findOneByEmail).not.toHaveBeenCalled();
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
