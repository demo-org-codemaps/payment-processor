import { EntityRepository, Repository } from 'typeorm';
import { PaymentIntentEntity } from '../entities';

@EntityRepository(PaymentIntentEntity)
export class PaymentIntentRepository extends Repository<PaymentIntentEntity> {}
