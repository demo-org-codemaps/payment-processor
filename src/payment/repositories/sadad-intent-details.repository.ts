import { EntityRepository, Repository } from 'typeorm';
import { SadadIntentDetails } from '../entities/sadad-intent-details.entity';

@EntityRepository(SadadIntentDetails)
export class SadadIntentDetailsRepository extends Repository<SadadIntentDetails> {}
