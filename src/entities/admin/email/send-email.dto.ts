import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Invalid email address', each: true })
  recipients: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}
