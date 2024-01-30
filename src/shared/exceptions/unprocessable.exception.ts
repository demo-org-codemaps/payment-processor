import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class UnprocessableException extends ApiException {
  constructor(key: string, args?: Record<string, any>) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, key, args);
  }
}
