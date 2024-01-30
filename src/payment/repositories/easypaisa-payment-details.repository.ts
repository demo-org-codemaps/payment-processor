import { EntityRepository, Repository } from 'typeorm';
import { EasypaisaPaymentDetails } from '../entities/easypaisa-payment-details.entity';

@EntityRepository(EasypaisaPaymentDetails)
export class EasypaisaPaymentDetailsRepository extends Repository<EasypaisaPaymentDetails> {}
