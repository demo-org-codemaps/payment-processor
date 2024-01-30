import { BaseEntity } from '../../core';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { PaymentStatusEntity } from './payment-status.entity';

@Entity()
export class EasypaisaPaymentDetails extends BaseEntity {
  @Column({
    nullable: false,
    type: 'varchar',
    name: 'transaction_auth_id',
  })
  transactionAuthId: string;

  @Column({
    nullable: false,
    type: 'varchar',
    name: 'transaction_date',
  })
  transactionDate: string;

  @Column({
    nullable: false,
    type: 'varchar',
    name: 'transaction_time',
  })
  transactionTime: string;

  @Column({
    nullable: false,
    type: 'varchar',
    name: 'transaction_id',
  })
  transactionId: string;

  @OneToOne(() => PaymentStatusEntity)
  @JoinColumn({
    name: 'payment_status_id',
  })
  paymentStatusId: PaymentStatusEntity;
}
