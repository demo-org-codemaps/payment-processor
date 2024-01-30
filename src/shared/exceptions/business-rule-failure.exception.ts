import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class BusinessRuleFailureException extends ApiException {
  constructor(key: string, args?: Record<string, any>) {
    super(HttpStatus.BAD_REQUEST, key, args);
  }
}
