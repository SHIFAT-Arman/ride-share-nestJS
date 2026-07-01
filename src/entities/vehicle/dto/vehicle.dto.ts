import {
  IsInt,
  IsString,
  IsNotEmpty,
  isAlpha,
  IsAlpha,
  IsEmail,
  Matches,
} from 'class-validator';

export class VehicleDto {
  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  @IsAlpha()
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({},
    { message:
        'invalid email'})

  driverAssigned: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{10}|\d{13}|\d{17})$/, {
    message:
      'verificationStatus must be a valid Bangladeshi NID (10, 13, or 17 digits)',
  })
  verificationStatus: string;

  filename: string;
}
