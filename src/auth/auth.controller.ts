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
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserType } from './user-type.enum';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { CreateRiderDto } from '../entities/rider/dto/create-rider.dto';
import { ApplyAsDriverDto } from './dto/apply-as-driver.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { Admin } from '../entities/admin/admin.entity';
import { Rider } from '../entities/rider/rider.entity';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { CsrfOriginGuard } from './guards/csrf-origin.guard';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './cookie-names';
import { RefreshPrincipal } from './token-pair.service';

interface RequestWithUser extends Request {
  user: { sub: string; email: string; role: UserType };
}

@Controller('/v1/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard) //skipped rolesguard
  @Get('me')
  public async me(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.getSessionMe(req.user);
    if (session.role !== req.user.role) {
      const { accessToken, refreshToken } =
        await this.authService.reissueForSession(session);
      setAuthCookies(
        res,
        accessToken,
        refreshToken,
        this.config,
        this.authService.cookieMaxAges(),
      );
    }
    return session;
  }

  @Public()
  @UseGuards(CsrfOriginGuard)
  @Post('login')
  public async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const { accessToken, refreshToken, role, sub, email } =
      await this.authService.login(loginDto);

    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      this.config,
      this.authService.cookieMaxAges(),
    );
    return { message: 'Logged In', role, sub, email };
  }

  @Public()
  @UseGuards(CsrfOriginGuard, RefreshAuthGuard)
  @Post('refresh')
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const principal = req.user as RefreshPrincipal;
    const { accessToken, refreshToken } =
      await this.authService.refresh(principal);

    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      this.config,
      this.authService.cookieMaxAges(),
    );
    return { message: 'Refreshed' };
  }

  @Public()
  @UseGuards(CsrfOriginGuard)
  @Post('logout')
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(raw);
    clearAuthCookies(res, this.config);
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

  /** Rider self-apply: same account → driver + vehicle; re-issues auth cookies. */
  @Post('register/driver')
  @Roles(UserType.RIDER)
  public async registerDriver(
    @Body() body: ApplyAsDriverDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const { accessToken, refreshToken, role, sub, email } =
      await this.authService.applyAsDriver(req.user.sub, body);

    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      this.config,
      this.authService.cookieMaxAges(),
    );
    return { message: 'Applied as driver', role, sub, email };
  }

  /** Flip active dashboard mode between rider and driver; re-issues auth cookies. */
  @Post('switch-role')
  @Roles(UserType.RIDER, UserType.DRIVER)
  public async switchRole(
    @Body() body: SwitchRoleDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<object> {
    const { accessToken, refreshToken, role, sub, email } =
      await this.authService.switchRole(req.user.sub, req.user.email, body);

    setAuthCookies(
      res,
      accessToken,
      refreshToken,
      this.config,
      this.authService.cookieMaxAges(),
    );
    return { message: 'Role switched', role, sub, email };
  }
}
