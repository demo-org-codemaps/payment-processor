import { EntityRepository, Repository } from 'typeorm';
import { SadadPaymentDetails } from '../entities/sadad-payment-details.entity';

@EntityRepository(SadadPaymentDetails)
export class SadadPaymentDetailsRepository extends Repository<SadadPaymentDetails> {}
