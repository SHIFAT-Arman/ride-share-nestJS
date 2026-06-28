import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEmail,
  IsDateString,
  IsPhoneNumber,
  Matches,
  Length,
  IsAlpha,
} from 'class-validator';

export class DriverDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsAlpha()
  @IsString()
  firstName?: string;

  @IsNotEmpty()
  @IsAlpha()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Matches(/@aiub\.edu$/)
  email?: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('BD')
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  @Matches(/[A-Z]/, {
    message: 'passwordHash must contain at least one uppercase letter',
  })
  passwordHash?: string;

  @IsNotEmpty()
  @IsDateString()
  licenseExpiryDate?: string;

  myfile?: string;
}
