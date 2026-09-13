import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import { UserType } from 'src/auth/user-type.enum';

/** Keep in sync with frontend CreateAnnouncementCard MAX_CONTENT_WORDS */
const MAX_CONTENT_WORDS = 200;

function MaxWords(max: number, validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'maxWords',
      constraints: [max],
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const words = value.trim().split(/\s+/).filter(Boolean).length;
          return words <= max;
        },
        defaultMessage: () =>
          `content must not exceed ${max} words`,
      },
    },
    validationOptions,
  );
}

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxWords(MAX_CONTENT_WORDS)
  content: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(UserType, { each: true })
  targetRoles: UserType[];
}
