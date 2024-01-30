import { MoneyDto } from '.';
import { OutDto } from './out.dto';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
export class RollbackDto extends OutDto {
  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  adjustedMoney: MoneyDto;
}
