import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '../users/user.entity';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Aquí el JWT guard debe haber llenado req.user
  },
);
