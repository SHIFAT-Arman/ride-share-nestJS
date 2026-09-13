import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Req,
  Res,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserType } from './user-type.enum';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { CreateDriverDto } from '../entities/driver/dto/create-driver.dto';
import { CreateRiderDto } from '../entities/rider/dto/create-rider.dto';
import { Admin } from '../entities/admin/admin.entity';
import { Driver } from '../entities/driver/driver.entity';
import { Rider } from '../entities/rider/rider.entity';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('/v1/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard) //skipped rolesguard
  @Get('me')
  public me(@Req() req: Request) {
    return req.user;
  }

  @Public()
  @Post('login')
  public async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { message: 'Logged In' };
  }

  @Public()
  @Post('logout')
  public logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return { message: 'Logged Out' };
  }

  @Public()
  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  public async registerRider(@Body() body: CreateRiderDto): Promise<Rider> {
    return this.authService.registerRider(body);
  }

  @Post('register/admin')
  @Roles(UserType.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  public async registerAdmin(@Body() body: CreateAdminDto): Promise<Admin> {
    return this.authService.registerAdmin(body);
  }

  @Post('register/driver')
  @Roles(UserType.RIDER, UserType.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  public async registerDriver(@Body() body: CreateDriverDto): Promise<Driver> {
    return this.authService.registerDriver(body);
  }
}
