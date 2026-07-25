import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { Announcement } from './announcement/announcement.entity';
import { PasswordService } from './password/password.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthGuard } from './auth/auth.guard';

console.log(process.env.JWT_SECRET);
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminProfile, Announcement]),
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AdminService, PasswordService, AuthService, AuthGuard],
  controllers: [AdminController, AuthController],
  // exports: [AdminService, PasswordService], // for auth- temporarily
})
export class AdminModule {}
