import { classToPlain, Expose } from 'class-transformer';
import { BaseEntity } from '../../core';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { PaymentIntentEntity } from './payment-intent.entity';

@Entity()
export class SadadIntentDetails extends BaseEntity {
  @Expose()
  @Column({
    nullable: false,
    unique: true,
    name: 'bill_number',
    length: 36,
  })
  billNumber: string;

  @Expose()
  @Column({
    nullable: false,
    name: 'sadad_number',
    length: 36,
  })
  sadadNumber: string;

  @Expose()
  @OneToOne(() => PaymentIntentEntity)
  @JoinColumn({
    name: 'payment_intent_id',
  })
  paymentIntentId: PaymentIntentEntity;

  toJSON() {
    const { ...rest } = classToPlain(this);
    return { ...rest };
  }
}
