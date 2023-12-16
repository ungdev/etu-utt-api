import { Reflector } from '@nestjs/core';

export const RequirePermission = Reflector.createDecorator<string[]>();
