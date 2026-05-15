import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (user: any) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  it('should allow access if no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ role: Role.CUSTOMER }))).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(mockContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(mockContext({ role: Role.CUSTOMER }))).toBe(false);
  });
});
