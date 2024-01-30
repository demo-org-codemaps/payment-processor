import { EasypaisaInquiryDto, EasypaisaIntentDto } from '../dtos/easypaisa-intent.dto';
import { EasypaisaResponseDto } from '../dtos/easypaisa-response.dto';

export const constructEasypaisaResponseUtil = (data: EasypaisaResponseDto) => {
  return {
    response_Code: data.responseCode,
    consumer_Detail: data?.consumerDetail || '',
    due_date: data?.dueDate || '',
    amount_within_dueDate: data?.amountWithinDueDate || '',
    amount_after_dueDate: data?.amountAfterDueDate || '',
    billing_month: data?.billingMonth || '',
    bill_status: data?.billStatus || '',
    date_paid: data?.datePaid || '',
    amount_paid: data?.amountPaid || '',
    tran_auth_Id: data?.transactionAuthId || '',
    reserved: data?.reserved || '',
  };
};

export const constructEasypaisaPaymentSuccessResponseUtil = (data: EasypaisaResponseDto) => {
  return {
    response_Code: data.responseCode,
    Identification_parameter: data?.identificationParameter,
    reserved: data?.reserved,
  };
};

export const formatAmountForEasypaisa = (amount: number): string => {
  return `+${amount.toString().padStart(13, '0')}`;
};

export const formatAmountPaidForEasypaisa = (amount: number): string => {
  return `${amount.toString().padStart(12, '0')}`;
};

export const getRetailerIdFromBillNumber = (billNumber: string): string => {
  return billNumber.substring(2, billNumber.length);
};

export const padTo2Digits = (num: number) => {
  return num.toString().padStart(2, '0');
};

export const getEasypaisaSuccessResponseData = (
  intent: EasypaisaIntentDto,
  data: EasypaisaInquiryDto,
  expiryDuration: number
) => {
  //formating amount according to response
  const amount = formatAmountForEasypaisa(intent.amount);
  const { responseCode, billStatus, consumerDetail, transactionAuthId, reserved, datePaid, amountPaid } = data;

  //format due date and billing month
  const date = new Date(intent.createdAt);
  date.setDate(date.getDate() + expiryDuration);
  const year = date.getFullYear().toString();
  const month = padTo2Digits(date.getMonth() + 1); // adding 1 because getMonth() starts from 0 (for Jan.)
  const dueDate = [year, month, padTo2Digits(date.getDate())].join('');
  const billingMonth = [year.substring(2, year.length), month].join('');

  return constructEasypaisaResponseUtil({
    responseCode,
    consumerDetail,
    dueDate,
    amountWithinDueDate: billStatus === 'P' ? formatAmountForEasypaisa(0) : amount,
    amountAfterDueDate: billStatus === 'P' ? formatAmountForEasypaisa(0) : amount,
    billingMonth,
    billStatus,
    datePaid,
    amountPaid: amountPaid ? formatAmountPaidForEasypaisa(parseInt(amountPaid)) : undefined,
    transactionAuthId,
    reserved,
  } as EasypaisaResponseDto);
};
