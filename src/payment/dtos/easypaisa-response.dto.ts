import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

@Expose()
export class EasypaisaResponseDto {
  @IsNotEmpty()
  @IsString()
  responseCode: string;

  @IsOptional()
  @IsString()
  consumerDetail: string;

  @IsOptional()
  @IsString()
  billStatus: string;

  @IsOptional()
  @IsString()
  dueDate: string;

  @IsOptional()
  @IsString()
  amountWithinDueDate: string;

  @IsOptional()
  @IsString()
  amountAfterDueDate: string;

  @IsOptional()
  @IsString()
  billingMonth: string;

  @IsOptional()
  @IsString()
  datePaid: string;

  @IsOptional()
  @IsString()
  amountPaid: string;

  @IsOptional()
  @IsString()
  transactionAuthId: string;

  @IsOptional()
  @IsString()
  identificationParameter: string;

  @IsOptional()
  @IsString()
  reserved: string;
}
