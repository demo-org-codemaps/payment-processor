import { classToPlain, Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

@Exclude()
export class BaseHeadersDto {
  @Expose()
  @IsNotEmpty()
  authorization: string;

  @Expose()
  @IsOptional()
  language?: string;

  toJSON() {
    return classToPlain(this, { exposeUnsetFields: false });
  }
}

@Exclude()
export class HeadersDto {
  @Expose()
  @IsNotEmpty()
  authorization: string;

  @Expose({ name: 'idempotency-key' })
  @IsNotEmpty({
    message: 'idempotency-key is missing in Headers',
  })
  idempotencyKey: string;

  @Expose()
  @IsOptional()
  language?: string;

  toJSON() {
    return classToPlain(this, { exposeUnsetFields: false });
  }
}
