import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  designation: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  testimonial: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  avatar: string;
}
