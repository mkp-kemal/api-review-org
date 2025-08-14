import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

export function RoleGuard(allowedRoles: string[]) {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new ForbiddenException('User not authenticated');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Insufficient role');
      }

      return true;
    }
  }

  return RoleGuardMixin;
}
