import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  Post,
  Res,
  SerializeOptions,
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
import type { Response } from 'express';
import { Public } from './decorators/public.decorator';

@Controller('/v1/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      maxAge: 15 * 60 * 1000, // 15 minutes
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
  @Post('register/:userType')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  public async register(
    @Param('userType') userType: UserType,
    @Body() body: CreateAdminDto | CreateDriverDto | CreateRiderDto,
  ): Promise<Admin | Driver | Rider> {
    return this.authService.register(userType, body);
  }
}
