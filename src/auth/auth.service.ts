import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RiderService } from '../entities/rider/rider.service';
import { DriverService } from '../entities/driver/driver.service';
import { AdminService } from '../entities/admin/admin.service';
import { EmailService } from '../entities/admin/email/email.service';
import { PasswordService } from '../entities/common/password.service';
import { CreateRiderDto } from '../entities/rider/dto/create-rider.dto';
import { CreateDriverDto } from '../entities/driver/dto/create-driver.dto';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { Rider } from '../entities/rider/rider.entity';
import { DriverEntity } from '../entities/driver/driver.entity';
import { Admin } from '../entities/admin/admin.entity';
import { UserType } from './user-type.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface NormalizedUser {
  id: string;
  email: string;
  password: string;
  role: string;
}

type RegisterBody = CreateAdminDto | CreateDriverDto | CreateRiderDto;
type RegisteredUser = Admin | DriverEntity | Rider;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly riderService: RiderService,
    private readonly driverService: DriverService,
    private readonly adminService: AdminService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  public async register(
    userType: UserType,
    body: RegisterBody,
  ): Promise<RegisteredUser> {
    switch (userType) {
      case UserType.RIDER: {
        const dto = await this.toValidatedDto(CreateRiderDto, body);
        if (await this.riderService.findOneByEmail(dto.email)) {
          throw new ConflictException('Rider already exists with this email');
        }
        return this.riderService.createRider(dto);
      }
      case UserType.DRIVER: {
        const dto = await this.toValidatedDto(CreateDriverDto, body);
        if (await this.driverService.findOneByEmail(dto.email)) {
          throw new ConflictException('Driver already exists with this email');
        }
        return this.driverService.createDriver(dto);
      }
      case UserType.ADMIN: {
        const dto = await this.toValidatedDto(CreateAdminDto, body);
        if (await this.adminService.findOneByEmail(dto.email)) {
          throw new ConflictException('Admin already exists with this email');
        }
        const admin = await this.adminService.createAdmin(dto);
        await this.sendWelcomeEmail(admin);
        return admin;
      }
      default:
        throw new BadRequestException('Invalid userType');
    }
  }

  public async login(
    email: string,
    password: string,
    userType: UserType,
  ): Promise<string> {
    const user = await this.findUserByType(email, userType);

    if (
      !user ||
      !(await this.passwordService.verify(password, user.password))
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.generateToken(user);
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

  private async sendWelcomeEmail(admin: Admin): Promise<void> {
    try {
      await this.emailService.sendEmail({
        recipients: [admin.email],
        subject: 'Welcome!',
        html: `<p>Hi ${admin.profile.firstName}, your account has been created.</p> <br> Please Login.`,
      });
    } catch (error) {
      this.logger.log('Error sending email:', error);
    }
  }

  private async findUserByType(
    email: string,
    userType: UserType,
  ): Promise<NormalizedUser | null> {
    switch (userType) {
      case UserType.RIDER: {
        const rider = await this.riderService.findOneByEmail(email);
        return rider
          ? {
              id: rider.id,
              email: rider.email,
              password: rider.password,
              role: 'rider',
            }
          : null;
      }
      case UserType.DRIVER: {
        const driver = await this.driverService.findOneByEmail(email);
        return driver
          ? {
              id: String(driver.id),
              email: driver.email,
              password: driver.password,
              role: 'driver',
            }
          : null;
      }
      case UserType.ADMIN: {
        const admin = await this.adminService.findOneByEmail(email);
        return admin
          ? {
              id: admin.id,
              email: admin.email,
              password: admin.password,
              role: admin.role,
            }
          : null;
      }
      default:
        return null;
    }
  }

  private generateToken(user: NormalizedUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
