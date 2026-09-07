import { IsEnum } from 'class-validator';
import { UserType } from 'src/auth/user-type.enum';

export class AdminParams {
  @IsEnum(UserType)
  role: UserType;
}
