import { classToPlain, Expose } from 'class-transformer';
import { BaseEntity } from '../../core';
import { Column, Entity } from 'typeorm';
import { IntentStateEnum, CurrencyCodeEnum, PaymentMethodEnum } from '../../shared';
import { MoneyDto } from '../dtos';

@Entity()
export class PaymentIntentEntity extends BaseEntity {
  @Expose()
  @Column({
    nullable: false,
    type: 'bigint',
  })
  amount: number;

  @Expose()
  @Column({
    nullable: false,
    name: 'currency',
    default: CurrencyCodeEnum.SAR,
  })
  currency: CurrencyCodeEnum;

  @Expose()
  @Column({
    nullable: false,
    name: 'payment_method',
    default: PaymentMethodEnum.SADAD,
  })
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @Column({
    nullable: false,
  })
  account: string;

  @Expose()
  @Column({
    type: 'enum',
    enum: IntentStateEnum,
    name: 'state',
    default: IntentStateEnum.PENDING,
  })
  state: IntentStateEnum;

  @Expose()
  @Column({
    nullable: false,
    unique: true,
    name: 'idempotency_key',
  })
  idempotencyKey: string;

  toJSON() {
    const { amount, currency, ...rest } = classToPlain(this);
    return { ...rest, money: new MoneyDto(amount, currency).toJSON() };
  }
}
