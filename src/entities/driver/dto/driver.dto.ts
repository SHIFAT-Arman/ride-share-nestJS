import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { DriverStatus } from '../driver.entity';

export class CreateDriverDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  age!: number;

  @IsOptional()
  @IsEnum(DriverStatus)
  status!: DriverStatus;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  myfile?: string;
}
export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}
