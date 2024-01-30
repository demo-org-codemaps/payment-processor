import { EntityRepository, Repository } from 'typeorm';
import { EasypaisaIntentDetails } from '../entities/easypaisa-intent-details.entity';

@EntityRepository(EasypaisaIntentDetails)
export class EasypaisaIntentDetailsRepository extends Repository<EasypaisaIntentDetails> {}
