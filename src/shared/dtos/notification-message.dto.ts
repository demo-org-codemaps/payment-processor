import { Exclude, Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class NotificationMessageDto {
  @Expose()
  @IsOptional()
  retailerId: string;

  @Expose()
  @IsOptional()
  currencyCode?: string;

  @Expose()
  @IsOptional()
  language?: string;

  @Expose()
  @IsOptional()
  templateName?: string;

  @Expose()
  @IsOptional()
  amount?: number;

  @Expose()
  @IsOptional()
  orderId?: string;
}
