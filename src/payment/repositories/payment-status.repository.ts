import { EntityRepository, Repository } from 'typeorm';
import { PaymentStatusEntity } from '../entities';

@EntityRepository(PaymentStatusEntity)
export class PaymentStatusRepository extends Repository<PaymentStatusEntity> {}
