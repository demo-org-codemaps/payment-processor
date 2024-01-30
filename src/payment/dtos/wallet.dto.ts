import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MoneyDto } from './money.dto';
import { TransactionTypeEnum } from '../../shared';

export class WalletDto {
  @Expose()
  @IsNotEmpty()
  retailerId: string;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  money: MoneyDto;

  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @Expose()
  @IsOptional()
  comments?: string;
}
