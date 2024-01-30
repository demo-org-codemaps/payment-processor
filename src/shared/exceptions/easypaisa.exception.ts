import { HttpException, HttpStatus } from '@nestjs/common';
import { EasypaisaInquiryErrorDto, EasypaisaPaymentErrorDto } from '../dtos/easypaisa-error.dto';

export class EasypaisaException extends HttpException {
  data: any;

  constructor() {
    super('OK', HttpStatus.OK);
  }
}

// below are inquiry errors
export class EasypaisaInquiryIntentNotFoundException extends EasypaisaException {
  data: EasypaisaInquiryErrorDto = {
    response_Code: '01',
    status: 'invalid consumer number',
    Response_Message: 'consumer number does not exists',
  };

  constructor(responseMsg?: string) {
    super();
    if (responseMsg) this.data.Response_Message = responseMsg;
  }
}
export class EasypaisaInquiryIntentExpiredException extends EasypaisaException {
  data: EasypaisaInquiryErrorDto = {
    response_Code: '01',
    status: 'invalid consumer number',
    Response_Message: 'topup intent expired',
  };

  constructor() {
    super();
  }
}
export class EasypaisaInquiryBadTransactionException extends EasypaisaException {
  data: EasypaisaInquiryErrorDto = {
    response_Code: '03',
    status: 'unknown error/bad transaction',
    Response_Message: 'Something went wrong',
  };

  constructor() {
    super();
  }
}
export class EasypaisaInquiryInvalidDataException extends EasypaisaException {
  data: EasypaisaInquiryErrorDto = {
    response_Code: '04',
    status: 'invalid data',
    Response_Message: 'invalid username, password or bank mnemonic',
  };

  constructor() {
    super();
  }
}

export const inquiryErrorFunctionNames = [
  'EasypaisaInquiryIntentNotFoundException',
  'EasypaisaInquiryIntentExpired',
  'EasypaisaInquiryBadTransactionException',
  'EasypaisaInquiryInvalidDataException',
];

// below are payment errors
export class EasypaisaPaymentIntentNotFoundException extends EasypaisaException {
  data: EasypaisaPaymentErrorDto = {
    response_Code: '01',
    Identification_parameter: 'invalid consumer number',
    reserved: 'consumer number does not exists',
  };

  constructor(identificationParameter?: string) {
    super();
    if (identificationParameter) this.data.Identification_parameter = identificationParameter;
  }
}
export class EasypaisaPaymentDuplicateTransactionException extends EasypaisaException {
  data: EasypaisaPaymentErrorDto = {
    response_Code: '03',
    Identification_parameter: 'duplicate transaction',
    reserved: 'transaction has already been processed',
  };

  constructor() {
    super();
  }
}
export class EasypaisaPaymentBadTransactionException extends EasypaisaException {
  data: EasypaisaPaymentErrorDto = {
    response_Code: '02',
    Identification_parameter: 'unknown error/bad transaction',
    reserved: 'Something went wrong',
  };

  constructor(identificationParameter?: string) {
    super();
    if (identificationParameter) this.data.Identification_parameter = identificationParameter;
  }
}
export class EasypaisaPaymentInvalidDataException extends EasypaisaException {
  data: EasypaisaPaymentErrorDto = {
    response_Code: '04',
    Identification_parameter: 'invalid data',
    reserved: 'invalid username, password or bank mnemonic',
  };

  constructor() {
    super();
  }
}

export const paymentErrorFunctionNames = [
  'EasypaisaPaymentIntentNotFoundException',
  'EasypaisaPaymentDuplicateTransactionException',
  'EasypaisaPaymentBadTransactionException',
  'EasypaisaPaymentInvalidDataException',
];
