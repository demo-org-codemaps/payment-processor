import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, ValidateNested, IsArray, IsNumberString } from 'class-validator';
import { IsPkrLimit } from '../../core/decorators/limit.decorator';
import { PaymentMethodEnum, TransactionTypeEnum } from '../../shared';
import { MoneyDto } from './money.dto';

export class CsvHoldDto {
  @Expose()
  @IsNotEmpty()
  @IsNumberString()
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
  @IsNotEmpty()
  transactionType: TransactionTypeEnum;

  @Expose()
  comments?: string;
}

@Expose()
export class TopupCsvArrayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvHoldDto)
  topups: CsvHoldDto[];
}
