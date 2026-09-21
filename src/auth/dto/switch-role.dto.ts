import { IsIn, IsNotEmpty } from 'class-validator';
import { UserType } from '../user-type.enum';

/** Active dashboard mode for dual rider/driver accounts. */
export class SwitchRoleDto {
  @IsNotEmpty()
  @IsIn([UserType.RIDER, UserType.DRIVER], {
    message: 'role must be rider or driver',
  })
  role: UserType.RIDER | UserType.DRIVER;
}
