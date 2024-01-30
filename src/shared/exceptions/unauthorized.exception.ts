import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class UnAuthorizedException extends ApiException {
  constructor(key: string, args?: Record<string, any>) {
    super(HttpStatus.UNAUTHORIZED, key, args);
  }
}
