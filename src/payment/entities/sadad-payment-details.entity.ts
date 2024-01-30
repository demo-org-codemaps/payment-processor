import { classToPlain, Expose } from 'class-transformer';
import { BaseEntity } from '../../core';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { PaymentStatusEntity } from './payment-status.entity';

@Entity()
export class SadadPaymentDetails extends BaseEntity {
  @Expose()
  @Column({
    nullable: false,
    name: 'sadad_payment_id',
    length: 100,
  })
  sadadPaymentId: string;

  @Expose()
  @Column({
    nullable: true,
    name: 'payload',
    type: 'simple-json',
  })
  payload: string;

  @Expose()
  @OneToOne(() => PaymentStatusEntity)
  @JoinColumn({
    name: 'payment_status_id',
  })
  paymentStatusId: PaymentStatusEntity;

  toJSON() {
    const { ...rest } = classToPlain(this);
    return { ...rest };
  }
}
