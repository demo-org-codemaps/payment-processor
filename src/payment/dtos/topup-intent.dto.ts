import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MoneyDto } from './money.dto';
import { PaymentMethodEnum } from '../../shared';
import { AllowedEasypaisaCurrencies } from '../../core/decorators/currency.decorator';

export class TopupIntentDto {
  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  @AllowedEasypaisaCurrencies()
  total: MoneyDto;

  @Expose()
  @IsEnum(PaymentMethodEnum)
  @IsNotEmpty()
  paymentMethod: PaymentMethodEnum;
}
