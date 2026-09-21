import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RiderService } from '../entities/rider/rider.service';
import { DriverService } from '../entities/driver/driver.service';
import { AdminService } from '../entities/admin/admin.service';
import { PasswordService } from '../entities/common/password.service';
import { UserService } from '../entities/user/user.service';
import { CreateRiderDto } from '../entities/rider/dto/create-rider.dto';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { Rider } from '../entities/rider/rider.entity';
import { Admin } from '../entities/admin/admin.entity';
import { ApplyAsDriverDto } from './dto/apply-as-driver.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { UserType } from './user-type.enum';

import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './dto/login.response';
import {
  RefreshPrincipal,
  TokenPair,
  TokenPairService,
} from './token-pair.service';

type RegisterBody = CreateAdminDto | CreateRiderDto;

export type SessionMe = {
  sub: string;
  email: string;
  role: UserType;
  availableRoles: UserType[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenPairs: TokenPairService,
    private readonly riderService: RiderService,
    private readonly driverService: DriverService,
    private readonly adminService: AdminService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
  ) {}

  public async registerRider(body: CreateRiderDto): Promise<Rider> {
    const dto = await this.toValidatedDto(CreateRiderDto, body);
    return this.riderService.createRider(dto);
  }

  public async applyAsDriver(
    userId: string,
    body: ApplyAsDriverDto,
  ): Promise<TokenPair> {
    const dto = await this.toValidatedDto(ApplyAsDriverDto, body);
    const { email } = await this.driverService.promoteRider(userId, dto);
    return this.tokenPairs.issue({
      id: userId,
      email,
      role: UserType.DRIVER,
    });
  }

  public async switchRole(
    userId: string,
    email: string,
    body: SwitchRoleDto,
  ): Promise<TokenPair> {
    const dto = await this.toValidatedDto(SwitchRoleDto, body);
    const target = dto.role;

    if (target === UserType.RIDER) {
      const ok = await this.riderService.restoreIfSoftDeleted(userId);
      if (!ok) {
        throw new ForbiddenException('No rider profile on this account');
      }
    } else if (!(await this.driverService.hasProfile(userId))) {
      throw new ForbiddenException('No driver profile on this account');
    }

    await this.userService.updateRole(userId, target);
    return this.tokenPairs.issue({
      id: userId,
      email,
      role: target,
    });
  }

  public async getSessionMe(user: {
    sub: string;
    email: string;
    role: UserType;
  }): Promise<SessionMe> {
    await this.userService.restoreIfSoftDeleted(user.sub);
    const role = await this.reconcileActiveRole(user.sub, user.role);
    const availableRoles = await this.listAvailableRoles(user.sub, role);
    return {
      sub: user.sub,
      email: user.email,
      role,
      availableRoles,
    };
  }

  public async reissueForSession(session: SessionMe): Promise<TokenPair> {
    return this.tokenPairs.issue({
      id: session.sub,
      email: session.email,
      role: session.role,
    });
  }

  public async registerAdmin(body: CreateAdminDto): Promise<Admin> {
    const dto = await this.toValidatedDto(CreateAdminDto, body);
    return this.adminService.createAdmin(dto);
  }

  public async login(loginDto: LoginDto): Promise<LoginResponse> {
    let user = await this.userService.findByEmail(loginDto.email, true);

    // Dual-profile delete used to soft-delete users while a sibling profile lived.
    if (!user) {
      await this.userService.restoreByEmailIfSoftDeleted(loginDto.email);
      user = await this.userService.findByEmail(loginDto.email, true);
    }

    if (
      !user ||
      !(await this.passwordService.verify(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const role = await this.reconcileActiveRole(user.id, user.role);
    return this.tokenPairs.issue({
      id: user.id,
      email: user.email,
      role,
    });
  }

  public async refresh(principal: RefreshPrincipal): Promise<LoginResponse> {
    return this.tokenPairs.rotate(principal);
  }

  public async logout(rawRefreshToken: string | undefined): Promise<void> {
    await this.tokenPairs.revokeRawRefreshToken(rawRefreshToken);
  }

  public cookieMaxAges() {
    return {
      accessMs: this.tokenPairs.accessMaxAgeMs(),
      refreshMs: this.tokenPairs.refreshMaxAgeMs(),
    };
  }

  private async listAvailableRoles(
    userId: string,
    activeRole: UserType,
  ): Promise<UserType[]> {
    if (activeRole === UserType.ADMIN) {
      return [UserType.ADMIN];
    }

    const roles: UserType[] = [];
    if (await this.riderService.hasProfileIncludingDeleted(userId)) {
      roles.push(UserType.RIDER);
    }
    if (await this.driverService.hasProfile(userId)) {
      roles.push(UserType.DRIVER);
    }
    return roles.length > 0 ? roles : [activeRole];
  }

  /**
   * If users.role points at a deleted profile but a sibling remains,
   * flip role to the live one (legacy dual-delete damage).
   */
  private async reconcileActiveRole(
    userId: string,
    role: UserType,
  ): Promise<UserType> {
    if (role === UserType.ADMIN) return role;

    const hasRider = await this.riderService.hasProfileIncludingDeleted(userId);
    const hasDriver = await this.driverService.hasProfile(userId);

    if (role === UserType.DRIVER && !hasDriver && hasRider) {
      await this.userService.updateRole(userId, UserType.RIDER);
      if (!(await this.riderService.hasProfile(userId))) {
        await this.riderService.restoreIfSoftDeleted(userId);
      }
      return UserType.RIDER;
    }
    if (role === UserType.RIDER && !hasRider && hasDriver) {
      await this.userService.updateRole(userId, UserType.DRIVER);
      return UserType.DRIVER;
    }
    return role;
  }

  // Validate the body against the DTO of the requested user type, mirroring
  // the global ValidationPipe behavior (whitelist + reject unknown fields).
  private async toValidatedDto<T extends object>(
    dtoClass: new () => T,
    body: RegisterBody | ApplyAsDriverDto | SwitchRoleDto,
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return dto;
  }
}
