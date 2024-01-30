import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { getI18nContextFromRequest } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CONSTANTS } from '../../app.constants';
import { ApiResponseDto } from '../../shared';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const i18nLang = getI18nContextFromRequest(context.switchToHttp().getRequest());
    switch (context.getHandler().name) {
      case 'sadadNotification':
      case 'billPaymentInquiry':
      case 'billPaymentConfirmation':
        return next.handle();
      default:
        return next.handle().pipe(
          map(({ data, name = 'SUCCESS', errors }) => ({
            name: name,
            message: i18nLang.translate(CONSTANTS.ERROR_MESSAGE_KEY_PREFIX + name),
            data,
            errors,
          }))
        );
    }
  }
}
