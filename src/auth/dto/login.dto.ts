import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserType } from '../user-type.enum';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsEnum(UserType)
  userType: UserType;
}
