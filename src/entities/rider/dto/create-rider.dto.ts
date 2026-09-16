import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRiderDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail(
    {},
    {
      message: 'Must be a valid email address',
    },
  )
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  age?: number;

  // status: RiderStatus; // not in DTO, because this is not API concern, rather business logic, so goes into entity
}
