import { IsEnum, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { TransactionTypeEnum } from '../../shared';

export class OutDto {
  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @Expose()
  @IsOptional()
  comments?: string;
}
