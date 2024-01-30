import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../core';
import { PaymentIntentEntity } from './payment-intent.entity';

@Entity()
export class EasypaisaIntentDetails extends BaseEntity {
  @Column({
    nullable: false,
    type: 'varchar',
    name: 'bill_number',
  })
  billNumber: string;

  @OneToOne(() => PaymentIntentEntity)
  @JoinColumn({
    name: 'payment_intent_id',
  })
  paymentIntentId: PaymentIntentEntity;
}
