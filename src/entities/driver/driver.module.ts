import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from './driver.entity';
import { RatingService } from '../rating/rating.service';
import { Rating } from '../rating/rating.entity';
import { VehicleService } from '../vehicle/vehicle.service';
import { Vehicle } from '../vehicle/vehicle.entity';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { PasswordService } from '../admin/password/password.service';
import { EmailService } from '../admin/email/email.service';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
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
    TypeOrmModule.forFeature([DriverEntity, Rating, Vehicle]),
  ],
  controllers: [DriverController, AuthController],
  providers: [
    DriverService,
    RatingService,
    VehicleService,
    EmailService,
    PasswordService,
    AuthService,
    RatingService,
  ],
})
export class DriverModule {}
