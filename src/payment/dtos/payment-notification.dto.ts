import { IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class PaymentNotificationDto {
  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  districtCode: string;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  sadadPaymentId: string;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  sadadNumber: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  paymentAmount: number;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  branchCode: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  bankId: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  accessChannel: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @Expose()
  @IsString()
  @IsOptional()
  billNumber: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  bankPaymentId: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  paymentDate: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  paymentStatus: string;
}
