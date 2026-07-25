import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { Admin } from '../admin.entity';
import { LoginDto } from './login.dto';
import { LoginResponse } from './login.response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  @Post('register')
  async register(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return await this.authService.register(createAdminDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const accessToken = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    return { access_token: accessToken };
  }
}
