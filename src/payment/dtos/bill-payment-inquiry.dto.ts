import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class BillPaymentInquiryDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @Expose({ name: 'Consumer_number' })
  billNumber: string;

  @IsNotEmpty()
  @IsString()
  @Expose({ name: 'Bank_Mnemonic' })
  bankMnemonic: string;

  @IsString()
  @Expose({ name: 'Reserved' })
  reserved: string;
}
