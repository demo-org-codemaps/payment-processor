import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UniqeTransactionDto {
  @Expose()
  @IsOptional()
  @IsString()
  billNumber: string;

  @Expose()
  @IsOptional()
  @IsString()
  account: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  transactionAuthId: string;

  @IsNotEmpty()
  @IsNumberString()
  @Expose()
  transactionDate: string;

  @IsNotEmpty()
  @IsNumberString()
  @Expose()
  transactionTime: string;
}
