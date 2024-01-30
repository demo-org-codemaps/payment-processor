import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class NotFoundException extends ApiException {
  constructor(key: string, args?: Record<string, any>) {
    super(HttpStatus.NOT_FOUND, key, args);
  }
}
