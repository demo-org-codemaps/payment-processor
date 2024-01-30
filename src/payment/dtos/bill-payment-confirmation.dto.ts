import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class BillPaymentConfirmationDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @Expose({ name: 'consumer_number' })
  billNumber: string;

  @IsNotEmpty()
  @IsString()
  @Expose({ name: 'tran_auth_id' })
  transactionAuthId: string;

  @IsNotEmpty()
  @IsNumberString()
  @Expose({ name: 'transaction_amount' })
  transactionAmount: string;

  @IsNotEmpty()
  @IsNumberString()
  @Expose({ name: 'tran_date' })
  transactionDate: string;

  @IsNotEmpty()
  @IsNumberString()
  @Expose({ name: 'tran_time' })
  transactionTime: string;

  @IsNotEmpty()
  @IsString()
  @Expose({ name: 'bank_mnemonic' })
  bankMnemonic: string;

  @IsNotEmpty()
  @IsString()
  reserved: string;
}
