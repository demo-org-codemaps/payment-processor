import { HttpException, Injectable } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { CONSTANTS } from '../../app.constants';
import { ApiErrorDto, ApiException, AppUtil, CSVFailedExceptions, ValidationFailedException } from '../../shared';
import { EasypaisaException } from '../../shared/exceptions/easypaisa.exception';
import { EasypaisaPaymentErrorDto } from '../../shared/dtos/easypaisa-error.dto';

@Injectable({})
export class ErrorService {
  VALIDATION_ERROR_PREFIX = 'VALIDATIONS.';

  constructor(private readonly i18n: I18nService) {}

  public async getErrorMessage(lang: string, key: string, args?: Record<string, any>): Promise<string> {
    const message = await this.i18n.translate(CONSTANTS.ERROR_MESSAGE_KEY_PREFIX + key, { lang, args });
    return message;
  }

  public async getUnexpectedError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'UNEXPECTED_ERROR',
      message: await this.getErrorMessage(lang, 'UNEXPECTED_ERROR'),
    });

    return errors;
  }

  public async getUnAuthorizedError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'UNAUTHORIZED',
      message: await this.getErrorMessage(lang, 'UNAUTHORIZED'),
    });

    return errors;
  }

  public async getAxiosError(exception: any, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'INTERSERVICE_ERROR',
      message: await this.getErrorMessage(lang, 'INTERSERVICE_ERROR'),
      data: {
        url: exception.config.url,
        ...exception?.response?.data,
      },
    });

    return errors;
  }

  public async getResourceNotFoundError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'RESOURCE_NOT_FOUND',
      message: await this.getErrorMessage(lang, 'RESOURCE_NOT_FOUND'),
    });

    return errors;
  }

  public async getErrorsFromHttpException(exception: HttpException, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: exception.message,
      message: await this.getErrorMessage(lang, exception.message),
    });

    return errors;
  }

  public async getErrorsFromApiException(exception: ApiException, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: exception.key,
      message: await this.getErrorMessage(lang, exception.key, exception.args),
    });

    return errors;
  }

  public getErrorsFromValidationFailedException(exception: ValidationFailedException, lang: string): ApiErrorDto[] {
    const errors: ApiErrorDto[] = [];

    for (const error of exception.validationErrors) {
      errors.push(this._getErrorFromValidationError(error.property, error, lang));
    }
    return errors;
  }

  public getCSVErrorsFromCSVFailedException(exceptions: CSVFailedExceptions, lang: string): ApiErrorDto[] {
    const errors: ApiErrorDto[] = [];
    const data = exceptions.errors.map(error => ({
      row: error.row,
      rowNum: error.rowNum,
      error: error.validationErrors.map(error => this._getErrorFromValidationError(error.property, error, lang)),
    }));
    errors.push(new ApiErrorDto(exceptions.name, exceptions.message, data));
    return errors;
  }

  public getEasypaisaPaymentErrors(exceptions: EasypaisaException): EasypaisaPaymentErrorDto {
    return exceptions.data;
  }

  private _getErrorFromValidationError(
    propertyName: string,
    validationError: ValidationError,
    lang: string
  ): ApiErrorDto {
    if (validationError.children && validationError.children.length > 0) {
      return this._getErrorFromValidationError(
        this._getPropertyName(propertyName, validationError),
        validationError.children[0],
        lang
      );
    }

    return { name: propertyName, message: Object.keys(validationError.constraints)[0] };
  }

  private _getPropertyName(propertyName, validationError: ValidationError): string {
    if (AppUtil.isNumber(parseInt(validationError.children[0].property))) {
      propertyName = propertyName + '[' + validationError.children[0].property + ']';
    } else {
      propertyName = propertyName + '.' + validationError.children[0].property;
    }
    return propertyName;
  }
}
