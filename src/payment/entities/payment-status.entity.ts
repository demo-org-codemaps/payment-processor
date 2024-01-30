import { classToPlain, Expose } from 'class-transformer';
import { BaseEntity } from '../../core';
import { Column, Entity } from 'typeorm';
import {
  PaymentImpactEnum,
  PaymentStateEnum,
  PaymentActionEnum,
  CurrencyCodeEnum,
  PaymentMethodEnum,
} from '../../shared';
import { MoneyDto } from '../dtos';

@Entity()
export class PaymentStatusEntity extends BaseEntity {
  @Expose()
  @Column({
    nullable: false,
    type: 'enum',
    enum: PaymentActionEnum,
    name: 'payment_action',
  })
  action: PaymentActionEnum;

  @Expose()
  @Column({
    nullable: false,
    type: 'enum',
    enum: PaymentImpactEnum,
  })
  impact: PaymentImpactEnum;

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
    default: CurrencyCodeEnum.PKR,
  })
  currency: CurrencyCodeEnum;

  @Expose()
  @Column({
    nullable: false,
    name: 'payment_method',
    default: PaymentMethodEnum.WALLET,
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
    enum: PaymentStateEnum,
    name: 'state',
    default: PaymentStateEnum.PENDING,
  })
  state: PaymentStateEnum;

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
