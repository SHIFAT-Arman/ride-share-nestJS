import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function trim({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateRatingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  comment?: string;
}
