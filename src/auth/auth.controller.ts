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
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './cookie-names';
import { RefreshPrincipal } from './token-pair.service';

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
    const { accessToken, refreshToken, role, sub, email } =
      await this.authService.login(loginDto);

    setAuthCookies(res, accessToken, refreshToken, this.authService.cookieMaxAges());
    return { message: 'Logged In', role, sub, email };
  }

  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const principal = req.user as RefreshPrincipal;
    const { accessToken, refreshToken } =
      await this.authService.refresh(principal);

    setAuthCookies(res, accessToken, refreshToken, this.authService.cookieMaxAges());
    return { message: 'Refreshed' };
  }

  @Public()
  @Post('logout')
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(raw);
    clearAuthCookies(res);
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
