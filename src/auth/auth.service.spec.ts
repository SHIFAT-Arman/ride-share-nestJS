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
import { VehicleType } from '../entities/vehicle/enums/vehicle-type.enum';

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
  const mockUserService = {
    findByEmail: jest.fn(),
    updateRole: jest.fn(),
    restoreIfSoftDeleted: jest.fn(),
    restoreByEmailIfSoftDeleted: jest.fn(),
  };
  const mockRiderService = {
    createRider: jest.fn(),
    hasProfile: jest.fn(),
    hasProfileIncludingDeleted: jest.fn(),
    restoreIfSoftDeleted: jest.fn(),
    getRiderById: jest.fn(),
  };
  const mockDriverService = {
    createDriver: jest.fn(),
    promoteRider: jest.fn(),
    hasProfile: jest.fn(),
    getDriverById: jest.fn(),
  };
  const mockAdminService = { createAdmin: jest.fn(), getAdminById: jest.fn() };

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

    it('applies a rider as driver and issues a driver token pair', async () => {
      mockDriverService.promoteRider.mockResolvedValue({
        email: 'jane@example.com',
      });
      mockTokenPairs.issue.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        role: 'driver',
        sub: 'user-uuid-1',
        email: 'jane@example.com',
      });

      const result = await authService.applyAsDriver('user-uuid-1', {
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '01700000000',
        vehicleType: VehicleType.CAR,
        licensePlate: 'Dhaka-1234',
        seatingCapacity: 4,
      });

      expect(result.role).toBe('driver');
      expect(mockDriverService.promoteRider).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.objectContaining({
          licensePlate: 'Dhaka-1234',
          vehicleType: VehicleType.CAR,
        }),
      );
      expect(mockTokenPairs.issue).toHaveBeenCalledWith({
        id: 'user-uuid-1',
        email: 'jane@example.com',
        role: 'driver',
      });
    });

    it('propagates ConflictException when already a driver', async () => {
      mockDriverService.promoteRider.mockRejectedValue(
        new ConflictException('Already registered as a driver'),
      );

      await expect(
        authService.applyAsDriver('user-uuid-1', {
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '01700000000',
          vehicleType: VehicleType.BIKE,
          licensePlate: 'Bike-1',
          seatingCapacity: 1,
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockTokenPairs.issue).not.toHaveBeenCalled();
    });

    it('switches active role to rider when a rider profile exists', async () => {
      mockRiderService.restoreIfSoftDeleted.mockResolvedValue(true);
      mockTokenPairs.issue.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        role: 'rider',
        sub: 'user-uuid-1',
        email: 'jane@example.com',
      });

      const result = await authService.switchRole(
        'user-uuid-1',
        'jane@example.com',
        { role: 'rider' as never },
      );

      expect(result.role).toBe('rider');
      expect(mockUserService.updateRole).toHaveBeenCalledWith(
        'user-uuid-1',
        'rider',
      );
      expect(mockTokenPairs.issue).toHaveBeenCalledWith({
        id: 'user-uuid-1',
        email: 'jane@example.com',
        role: 'rider',
      });
    });

    it('rejects switch to driver when no driver profile exists', async () => {
      mockDriverService.hasProfile.mockResolvedValue(false);

      await expect(
        authService.switchRole('user-uuid-1', 'jane@example.com', {
          role: 'driver' as never,
        }),
      ).rejects.toThrow('No driver profile on this account');
      expect(mockTokenPairs.issue).not.toHaveBeenCalled();
    });

    it('returns availableRoles for dual accounts on me', async () => {
      mockRiderService.hasProfileIncludingDeleted.mockResolvedValue(true);
      mockDriverService.hasProfile.mockResolvedValue(true);
      mockDriverService.getDriverById.mockResolvedValue({
        firstName: 'Jane',
        lastName: 'Doe',
      });

      const me = await authService.getSessionMe({
        sub: 'user-uuid-1',
        email: 'jane@example.com',
        role: 'driver' as never,
      });

      expect(me.availableRoles).toEqual(['rider', 'driver']);
      expect(me.role).toBe('driver');
      expect(me.name).toBe('Jane Doe');
    });

    it('returns a null name when the active profile is missing', async () => {
      mockRiderService.hasProfileIncludingDeleted.mockResolvedValue(true);
      mockRiderService.getRiderById.mockRejectedValue(new Error('missing'));

      const me = await authService.getSessionMe({
        sub: 'user-uuid-1',
        email: 'jane@example.com',
        role: 'rider' as never,
      });

      expect(me.name).toBeNull();
      expect(me.email).toBe('jane@example.com');
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
