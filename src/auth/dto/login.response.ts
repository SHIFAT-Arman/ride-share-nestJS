import { UserType } from '../user-type.enum';

export interface LoginResponse {
  accessToken: string; // for Bruno
  refreshToken: string; // for Bruno
  role: UserType;
  sub: string;
  email: string;
}
