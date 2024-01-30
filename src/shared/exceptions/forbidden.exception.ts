import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class ForbiddenException extends ApiException {
  constructor(key: string, args?: Record<string, any>) {
    super(HttpStatus.FORBIDDEN, key, args);
  }
}
