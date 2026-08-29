import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../constants/roles.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  org_id?: string;
  district?: string;
  name?: string;
  verified?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
