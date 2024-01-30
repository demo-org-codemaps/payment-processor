import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { classToPlain, Expose } from 'class-transformer';
import { CurrencyCodeEnum, IntentStateEnum, PaymentMethodEnum } from '../../shared';
import { MoneyDto } from './money.dto';

export class EasypaisaIntentDto {
  @Expose()
  @IsOptional()
  id: string;

  @Expose()
  @IsNotEmpty()
  createdAt: string;

  @Expose()
  @IsNotEmpty()
  updatedAt: string;

  @Expose()
  @IsNotEmpty()
  amount: number;

  @Expose()
  @IsOptional()
  @IsEnum(CurrencyCodeEnum)
  currency: CurrencyCodeEnum;

  @Expose()
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @IsOptional()
  account: string;

  @Expose()
  @IsOptional()
  state: IntentStateEnum;

  @Expose()
  @IsOptional()
  billNumber: string;

  @Expose()
  @IsOptional()
  idempotencyKey: string;

  toJSON() {
    const { amount, currency, ...rest } = classToPlain(this);
    const moneyDto = new MoneyDto(amount, currency).toJSON();
    return { ...rest, amount: moneyDto.amount, currency: moneyDto.currency };
  }
}

export class EasypaisaInquiryDto {
  @Expose()
  @IsNotEmpty()
  consumerDetail: string;

  @Expose()
  @IsNotEmpty()
  responseCode: string;

  @Expose()
  @IsNotEmpty()
  billStatus: string;

  @Expose()
  @IsOptional()
  transactionAuthId: string;

  @Expose()
  @IsOptional()
  reserved: string;

  @Expose()
  @IsOptional()
  datePaid: string;

  @Expose()
  @IsOptional()
  amountPaid: string;
}

export class EasypaisaTransactionDto {
  @Expose()
  @IsOptional()
  amount: string;

  @Expose()
  @IsOptional()
  transactionAuthId: string;

  @Expose()
  @IsOptional()
  transactionDate: string;

  @Expose()
  @IsOptional()
  transactionId: string;
}
