import { IsEnum, IsNotEmpty } from 'class-validator';
import { classToPlain, Expose } from 'class-transformer';
import { CurrencyCodeEnum, IntentStateEnum, PaymentMethodEnum } from '../../shared';
import { MoneyDto } from './money.dto';

export class SadadIntentDto {
  @Expose()
  @IsNotEmpty()
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
  @IsNotEmpty()
  @IsEnum(CurrencyCodeEnum)
  currency: CurrencyCodeEnum;

  @Expose()
  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @IsNotEmpty()
  account: string;

  @Expose()
  @IsNotEmpty()
  state: IntentStateEnum;

  @Expose()
  @IsNotEmpty()
  billNumber: string;

  @Expose()
  @IsNotEmpty()
  idempotencyKey: string;

  @Expose()
  @IsNotEmpty()
  ref3P: string;

  toJSON() {
    const { amount, currency, ...rest } = classToPlain(this);
    return { ...rest, money: new MoneyDto(amount, currency).toJSON() };
  }
}
