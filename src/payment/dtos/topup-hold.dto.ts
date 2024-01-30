import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaymentMethodEnum, TransactionTypeEnum } from '../../shared';
import { MoneyDto } from './money.dto';
import { IsPkrLimit } from '../../core/decorators/limit.decorator';

export class TopupHoldDto {
  @Expose()
  @IsNotEmpty()
  account: string;

  @Expose()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsPkrLimit()
  money: MoneyDto;

  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @Expose()
  @IsOptional()
  comments?: string;
}
