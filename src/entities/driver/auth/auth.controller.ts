import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { LoginResponse } from './login.response';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverEntity } from '../driver.entity';

@Controller('driver/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ strategy: 'excludeAll' })
  @Post('register')
  async register(
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverEntity> {
    return await this.authService.register(createDriverDto);
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
