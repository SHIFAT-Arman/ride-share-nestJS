import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';
import { RiderModule } from '../entities/rider/rider.module';
import { DriverModule } from '../entities/driver/driver.module';
import { AdminModule } from '../entities/admin/admin.module';
import { EmailService } from '../entities/admin/email/email.service';
import { PasswordService } from '../entities/common/password.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    RiderModule,
    DriverModule,
    AdminModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
    SelfOrAdminGuard,
    EmailService,
  ],
  exports: [JwtAuthGuard, RolesGuard, SelfOrAdminGuard],
})
export class AuthModule {}
