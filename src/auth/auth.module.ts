import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

import { RiderModule } from '../entities/rider/rider.module';
import { DriverModule } from '../entities/driver/driver.module';
import { AdminModule } from '../entities/admin/admin.module';
import { UserModule } from '../entities/user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { RefreshToken } from './refresh-token.entity';
import { REFRESH_TOKEN_STORE } from './refresh-token.store';
import { TypeOrmRefreshTokenStore } from './typeorm-refresh-token.store';
import { TokenPairService } from './token-pair.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
    RiderModule,
    DriverModule,
    AdminModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenPairService,
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshAuthGuard,
    {
      provide: REFRESH_TOKEN_STORE,
      useClass: TypeOrmRefreshTokenStore,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    SelfOrAdminGuard,
  ],
  exports: [SelfOrAdminGuard, TokenPairService],
})
export class AuthModule {}
