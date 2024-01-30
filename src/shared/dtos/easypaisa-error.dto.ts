export class EasypaisaPaymentErrorDto {
  response_Code: string;
  Identification_parameter: string;
  reserved: string;

  constructor(responseCode: string, identificationParameter: string, reserved: string) {
    this.response_Code = responseCode;
    this.Identification_parameter = identificationParameter;
    this.reserved = reserved;
  }
}

export class EasypaisaInquiryErrorDto {
  response_Code: string;
  Response_Message: string;
  status: string;

  constructor(responseCode: string, responseMessage: string, status: string) {
    this.response_Code = responseCode;
    this.Response_Message = responseMessage;
    this.status = status;
  }
}
