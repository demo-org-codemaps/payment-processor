import { IsEnum, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';
import { CurrencyCodeEnum, PaymentMethodEnum } from '../../shared';

export class LmsDataDto {
  @Expose()
  @IsNotEmpty()
  retailerId: number;

  @Expose()
  @IsNotEmpty()
  repaymentAmount: number;

  @Expose()
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currencyCode?: CurrencyCodeEnum;

  @Expose()
  @IsNotEmpty()
  orderId: number;

  @Expose()
  @IsEnum(PaymentMethodEnum)
  @IsNotEmpty()
  loanRepaymentMethod: string;
}
