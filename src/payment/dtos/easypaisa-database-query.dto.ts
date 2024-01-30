import { IsNotEmpty, IsNumberString } from 'class-validator';

export class EasypaisaPaymentDetailsQueryDto {
  @IsNotEmpty()
  @IsNumberString()
  account: string;

  @IsNotEmpty()
  @IsNumberString()
  transactionAuthId: string;

  @IsNotEmpty()
  @IsNumberString()
  transactionDate: string;

  @IsNotEmpty()
  @IsNumberString()
  transactionTime: string;
}
