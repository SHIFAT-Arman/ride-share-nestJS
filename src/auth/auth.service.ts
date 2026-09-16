import {
  BadRequestException,
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
import { CreateDriverDto } from '../entities/driver/dto/create-driver.dto';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { Rider } from '../entities/rider/rider.entity';
import { Driver } from '../entities/driver/driver.entity';
import { Admin } from '../entities/admin/admin.entity';

import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './dto/login.response';
import {
  RefreshPrincipal,
  TokenPairService,
} from './token-pair.service';

type RegisterBody = CreateAdminDto | CreateDriverDto | CreateRiderDto;

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

  public async registerDriver(body: CreateDriverDto): Promise<Driver> {
    const dto = await this.toValidatedDto(CreateDriverDto, body);
    return this.driverService.createDriver(dto);
  }

  public async registerAdmin(body: CreateAdminDto): Promise<Admin> {
    const dto = await this.toValidatedDto(CreateAdminDto, body);
    return this.adminService.createAdmin(dto);
  }

  public async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(loginDto.email, true);

    if (
      !user ||
      !(await this.passwordService.verify(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.tokenPairs.issue(user);
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

  // Validate the body against the DTO of the requested user type, mirroring
  // the global ValidationPipe behavior (whitelist + reject unknown fields).
  private async toValidatedDto<T extends object>(
    dtoClass: new () => T,
    body: RegisterBody,
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
