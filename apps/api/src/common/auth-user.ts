import { Role } from '@prisma/client';

/** Thông tin người dùng gắn vào request sau khi xác thực JWT. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
