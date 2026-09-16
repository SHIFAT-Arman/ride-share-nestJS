import { UserType } from '../user-type.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserType;
  type?: 'access' | 'refresh';
}
