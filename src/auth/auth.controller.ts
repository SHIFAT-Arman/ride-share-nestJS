import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './dto/login.response';
import { UserType } from './user-type.enum';
import { CreateAdminDto } from '../entities/admin/dto/create-admin.dto';
import { CreateDriverDto } from '../entities/driver/dto/create-driver.dto';
import { CreateRiderDto } from '../entities/rider/dto/create-rider.dto';
import { Admin } from '../entities/admin/admin.entity';
import { DriverEntity } from '../entities/driver/driver.entity';
import { Rider } from '../entities/rider/rider.entity';

@Controller('/v1/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const accessToken = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.userType,
    );

    return { access_token: accessToken };
  }

  @Post('register/:userType')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  public async register(
    @Param('userType') userType: UserType,
    @Body() body: CreateAdminDto | CreateDriverDto | CreateRiderDto,
  ): Promise<Admin | DriverEntity | Rider> {
    return this.authService.register(userType, body);
  }
}
