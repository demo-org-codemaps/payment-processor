import { Injectable } from '@nestjs/common';
import {
  IntentStateEnum,
  MapperUtil,
  PaymentActionEnum,
  PaymentImpactEnum,
  PaymentMethodEnum,
  PaymentStateEnum,
} from '../../shared';
import { Connection, createQueryBuilder, In, SelectQueryBuilder } from 'typeorm';
import { PaymentIntentEntity, PaymentStatusEntity } from '../entities';
import { PaymentIntentRepository, PaymentStatusRepository } from '../repositories';
import { SadadIntentDetails } from '../entities/sadad-intent-details.entity';
import { SadadIntentDto } from '../dtos/sadad-intent.dto';
import { SadadPaymentDetails } from '../entities/sadad-payment-details.entity';
import { EasypaisaIntentDetails } from '../entities/easypaisa-intent-details.entity';
import { EasypaisaPaymentDetails } from '../entities/easypaisa-payment-details.entity';
import { EasypaisaIntentDetailsRepository } from '../repositories/easypaisa-intent-details.repository';
import { EasypaisaPaymentDetailsRepository } from '../repositories/easypaisa-payment-details.repository';
import { EasypaisaIntentDto, EasypaisaTransactionDto } from '../dtos/easypaisa-intent.dto';
import { ConfigService } from '@nestjs/config';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EasypaisaPaymentDetailsQueryDto } from '../dtos/easypaisa-database-query.dto';

@Injectable()
export class DbWrapperService {
  private readonly easypaisaIntentExpiryDuration: string;

  constructor(
    private readonly connection: Connection,
    private readonly paymentStatusRepository: PaymentStatusRepository,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly easypaisaIntentDetailsRepository: EasypaisaIntentDetailsRepository,
    private readonly easypaisaPaymentDetailsRepository: EasypaisaPaymentDetailsRepository,
    private readonly configService: ConfigService
  ) {
    this.easypaisaIntentExpiryDuration = this.configService.get('EXPIRE_TOPUP_INTENT');
  }

  async createPayment(entity: Partial<PaymentStatusEntity>): Promise<PaymentStatusEntity> {
    const paymentStatusEntity: PaymentStatusEntity = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(PaymentStatusEntity, entity);
      return await transManager.findOneOrFail<PaymentStatusEntity>(PaymentStatusEntity, identifiers[0]['id']);
    });
    return paymentStatusEntity;
  }

  async createIntent(entity: Partial<PaymentIntentEntity>): Promise<PaymentIntentEntity> {
    const paymentIntentEntity: PaymentIntentEntity = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(PaymentIntentEntity, entity);
      return await transManager.findOneOrFail<PaymentIntentEntity>(PaymentIntentEntity, identifiers[0]['id']);
    });
    return paymentIntentEntity;
  }

  async setPaymentState(id: string, state: PaymentStateEnum): Promise<PaymentStatusEntity> {
    const paymentStatusEntity: PaymentStatusEntity = await this.connection.transaction(async transManager => {
      await transManager.update(PaymentStatusEntity, { id }, { state });
      return await transManager.findOneOrFail<PaymentStatusEntity>(PaymentStatusEntity, id);
    });
    return paymentStatusEntity;
  }

  async setIntentState(id: string, state: IntentStateEnum): Promise<PaymentIntentEntity> {
    const paymentIntentEntity: PaymentIntentEntity = await this.connection.transaction(async transManager => {
      await transManager.update(PaymentIntentEntity, { id }, { state });
      return await transManager.findOneOrFail<PaymentIntentEntity>(PaymentIntentEntity, id);
    });
    return paymentIntentEntity;
  }

  async completePaymentIntent(sadadNumber: string, payload: string): Promise<PaymentStatusEntity> {
    const paymentStatusEntity: PaymentStatusEntity = await this.connection.transaction(async transManager => {
      //fetch intent by sadad number
      const intent = await this.getPaymentIntentDetailsBySadadNumber(sadadNumber);

      //update payment intent to completed
      await transManager.update(PaymentIntentEntity, { id: intent.id }, { state: IntentStateEnum.COMPLETED });

      //insert into payment ledger
      const convEntity = MapperUtil.map(PaymentStatusEntity, intent);
      const { identifiers } = await transManager.insert(PaymentStatusEntity, {
        ...convEntity,
        action: PaymentActionEnum.HOLD,
        state: PaymentStateEnum.COMPLETED,
        impact: PaymentImpactEnum.IN,
      });

      //fetch the inserted data
      const paymentStatusEntity = await transManager.findOneOrFail<PaymentStatusEntity>(
        PaymentStatusEntity,
        identifiers[0]['id']
      );

      //insert into sadad details table
      const { sadadPaymentId } = JSON.parse(payload);
      await transManager.insert(SadadPaymentDetails, {
        sadadPaymentId,
        payload,
        paymentStatusId: paymentStatusEntity,
      });
      return paymentStatusEntity;
    });
    return paymentStatusEntity;
  }

  async cancelPaymentIntent(idempotencyKey: string): Promise<PaymentIntentEntity> {
    const paymentIntentEntity: PaymentIntentEntity = await this.connection.transaction(async transManager => {
      const intent = await transManager.findOneOrFail<PaymentIntentEntity>(PaymentIntentEntity, {
        where: { idempotencyKey },
      });
      if (intent?.state == IntentStateEnum.PENDING) {
        await transManager.update(PaymentIntentEntity, { id: intent.id }, { state: IntentStateEnum.CANCELLED });
        return intent;
      }
      return null;
    });
    return paymentIntentEntity;
  }

  async setPaymentsState(ids: string[], state: PaymentStateEnum): Promise<boolean> {
    const res = await this.paymentStatusRepository.update({ id: In(ids) }, { state });
    return res.affected == ids.length;
  }

  async fetchPayments(ids: string[]): Promise<PaymentStatusEntity[]> {
    const paymentTransactions: PaymentStatusEntity[] = await this.paymentStatusRepository.findByIds(ids);
    return paymentTransactions;
  }

  async findByIdempKey(idempotencyKey: string): Promise<PaymentStatusEntity> {
    const sunTransaction: PaymentStatusEntity = await this.paymentStatusRepository.findOne({ idempotencyKey });
    return sunTransaction;
  }

  async findIntentByIdempKey(idempotencyKey: string): Promise<PaymentIntentEntity> {
    const intent: PaymentIntentEntity = await this.paymentIntentRepository.findOne({ idempotencyKey });
    return intent;
  }

  async getPaymentIntentDetailsBySadadNumber(sadadNumber: string): Promise<SadadIntentDto> {
    const intent = await createQueryBuilder()
      .select([
        'pie.id as id',
        'pie.created_at as createdAt',
        'pie.updated_at as updatedAt',
        'pie.amount as amount',
        'pie.currency as currency',
        'pie.payment_method as paymentMethod',
        'pie.state as state',
        'pie.account as account',
        'pie.idempotency_key as idempotencyKey',
        'pie.version as version',
        'pie.account as account',
        'sid.bill_number as billNumber',
        'sid.sadad_number as ref3P',
      ])
      .from(PaymentIntentEntity, 'pie')
      .innerJoin(SadadIntentDetails, 'sid', 'pie.id = sid.payment_intent_id')

      .where('sid.sadad_number = :sadadNumber', { sadadNumber })
      .getRawOne();

    return intent;
  }

  async getPaymentIntentDetailsByIdempKey(idempotencyKey: string): Promise<SadadIntentDto> {
    const intent = await createQueryBuilder()
      .select([
        'pie.id as id',
        'pie.created_at as createdAt',
        'pie.updated_at as updatedAt',
        'pie.amount as amount',
        'pie.currency as currency',
        'pie.payment_method as paymentMethod',
        'pie.state as state',
        'pie.account as account',
        'pie.idempotency_key as idempotencyKey',
        'pie.version as version',
        'pie.account as account',
        'sid.bill_number as billNumber',
        'sid.sadad_number as ref3P',
      ])
      .from(PaymentIntentEntity, 'pie')
      .innerJoin(SadadIntentDetails, 'sid', 'pie.id = sid.payment_intent_id')

      .where('pie.idempotency_key = :idempotencyKey', { idempotencyKey })
      .getRawOne();

    return intent;
  }

  async easypaisaSelectQuery(): Promise<SelectQueryBuilder<PaymentIntentEntity>> {
    return createQueryBuilder()
      .select([
        'pie.id as id',
        'pie.created_at as createdAt',
        'pie.updated_at as updatedAt',
        'pie.amount as amount',
        'pie.currency as currency',
        'pie.payment_method as paymentMethod',
        'pie.state as state',
        'pie.account as account',
        'pie.idempotency_key as idempotencyKey',
        'pie.account as account',
        'eid.bill_number as billNumber',
      ])
      .from(PaymentIntentEntity, 'pie')
      .innerJoin(EasypaisaIntentDetails, 'eid', 'pie.id = eid.payment_intent_id');
  }

  //get easypaisa intent by billNumber and state
  async getEasypaisaIntent(billNumber: string, state: IntentStateEnum): Promise<EasypaisaIntentDto> {
    const intentQueryBuilder = await this.easypaisaSelectQuery();
    return intentQueryBuilder
      .where('eid.bill_number = :billNumber', { billNumber })
      .andWhere('pie.state = :state', { state })
      .getRawOne();
  }

  async getEasypaisaIntentById(paymentIntentId: string): Promise<EasypaisaIntentDto> {
    const intentQueryBuilder = await this.easypaisaSelectQuery();
    return intentQueryBuilder.where('pie.id = :paymentIntentId', { paymentIntentId }).getRawOne();
  }

  async getValidEasypaisaIntent(account: string, state: IntentStateEnum): Promise<EasypaisaIntentDto[]> {
    const expDate = new Date();
    const intentExpiry = this.easypaisaIntentExpiryDuration;
    const expiryDuration = parseInt(intentExpiry);
    expDate.setDate(expDate.getDate() - expiryDuration);
    const isoDate = expDate.toISOString();

    const intentQueryBuilder = await this.easypaisaSelectQuery();

    return intentQueryBuilder
      .where('pie.account = :account', { account })
      .andWhere('pie.payment_method = :paymentMethod', { paymentMethod: PaymentMethodEnum.EASYPAISA })
      .andWhere('pie.state = :state', { state })
      .andWhere('eid.created_at > :expDate', { expDate: isoDate })
      .getRawMany();
  }

  async getEasypaisaTransactionData(idempotencyKey: string): Promise<EasypaisaTransactionDto> {
    return createQueryBuilder()
      .select([
        'pse.amount as amount',
        'epd.transaction_auth_id as transactionAuthId',
        'epd.transaction_date as transactionDate',
        'epd.transaction_id as transactionId',
      ])
      .from(PaymentStatusEntity, 'pse')
      .innerJoin(EasypaisaPaymentDetails, 'epd', 'pse.id = epd.payment_status_id')
      .where('pse.idempotency_key = :idempotencyKey', { idempotencyKey })
      .getRawOne();
  }

  async getRecentEasypaisaIntent(account: string): Promise<EasypaisaIntentDto> {
    const intentQueryBuilder = await this.easypaisaSelectQuery();

    return intentQueryBuilder
      .where('pie.account = :account', { account })
      .andWhere('pie.payment_method = :paymentMethod', { paymentMethod: PaymentMethodEnum.EASYPAISA })
      .orderBy('eid.created_at', 'DESC')
      .getRawOne();
  }

  async getValidEasypaisaIntentByIdempKey(idempotencyKey: string): Promise<EasypaisaIntentDto> {
    const expDate = new Date();
    const intentExpiry = this.easypaisaIntentExpiryDuration;
    const expiryDuration = parseInt(intentExpiry);
    expDate.setDate(expDate.getDate() - expiryDuration);
    const isoDate = expDate.toISOString();

    const intentQueryBuilder = await this.easypaisaSelectQuery();

    return intentQueryBuilder
      .where('pie.idempotency_key = :idempotencyKey', { idempotencyKey })
      .andWhere('eid.created_at > :expDate', { expDate: isoDate })
      .getRawOne();
  }

  async createIntentDetails(entity: Partial<SadadIntentDetails>): Promise<SadadIntentDetails> {
    const sadadIntentDetails: SadadIntentDetails = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(SadadIntentDetails, entity);
      return await transManager.findOneOrFail<SadadIntentDetails>(SadadIntentDetails, identifiers[0]['id']);
    });
    return sadadIntentDetails;
  }

  async createEasypaisaPaymentIntent(
    entity: Partial<PaymentIntentEntity>,
    billNumber: string
  ): Promise<EasypaisaIntentDto> {
    const paymentIntent = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(PaymentIntentEntity, entity);
      const paymentIntentEntity = await transManager.findOne<PaymentIntentEntity>(
        PaymentIntentEntity,
        identifiers[0]['id']
      );
      await transManager.insert(EasypaisaIntentDetails, {
        billNumber,
        paymentIntentId: paymentIntentEntity,
      });
      return paymentIntentEntity;
    });
    return this.getEasypaisaIntentById(paymentIntent.id);
  }

  async findTopupIntent(account: string, state: IntentStateEnum): Promise<EasypaisaIntentDto[]> {
    return await this.getValidEasypaisaIntent(account, state);
  }

  async findTopupIntentByIdempKey(idempotencyKey: string): Promise<EasypaisaIntentDto> {
    return await this.getValidEasypaisaIntentByIdempKey(idempotencyKey);
  }

  async updateWalletTopupIntentStatesByAccount(account: string, updatedState: IntentStateEnum): Promise<any> {
    await this.connection.transaction(async transManager => {
      await transManager.update(PaymentIntentEntity, { account }, { state: updatedState });
    });
  }

  async getPendingEasypaisaIntentsByBillNumber(
    billNumber: string,
    checkExpiry?: boolean
  ): Promise<PaymentIntentEntity[]> {
    const intentQueryBuilder = await this.easypaisaSelectQuery();

    intentQueryBuilder
      .where('eid.bill_number = :billNumber', { billNumber })
      .andWhere('pie.payment_method = :paymentMethod', { paymentMethod: PaymentMethodEnum.EASYPAISA })
      .andWhere('pie.state = :state', { state: IntentStateEnum.PENDING });

    if (checkExpiry) {
      const expiryDate = new Date();
      const expiryDuration = parseInt(this.easypaisaIntentExpiryDuration);
      expiryDate.setDate(expiryDate.getDate() - expiryDuration);
      intentQueryBuilder.andWhere('eid.created_at > :expiryDate', { expiryDate: expiryDate.toISOString() });
    }

    return await intentQueryBuilder.getRawMany();
  }

  async createEasypaisaPaymentDetails(
    easypaisaPaymentDetailsObject: Partial<EasypaisaPaymentDetails>
  ): Promise<EasypaisaPaymentDetails> {
    const easypaisaPaymentDetails: EasypaisaPaymentDetails = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(EasypaisaPaymentDetails, easypaisaPaymentDetailsObject);
      return await transManager.findOneOrFail<EasypaisaPaymentDetails>(EasypaisaPaymentDetails, identifiers[0]['id']);
    });
    return easypaisaPaymentDetails;
  }

  async updatePaymentStatusEntity(
    id: string,
    propertiesToUpdate: QueryDeepPartialEntity<PaymentStatusEntity>
  ): Promise<PaymentStatusEntity> {
    const paymentStatusEntity: PaymentStatusEntity = await this.connection.transaction(async transManager => {
      await transManager.update(PaymentStatusEntity, { id }, propertiesToUpdate);
      return await transManager.findOneOrFail<PaymentStatusEntity>(PaymentStatusEntity, id);
    });
    return paymentStatusEntity;
  }

  easypaisaPaymentDetailsSelectQuery(): SelectQueryBuilder<PaymentStatusEntity> {
    return createQueryBuilder()
      .select([
        'pse.account as account',
        'epd.transaction_auth_id as transactionAuthId',
        'epd.transaction_date as transactionDate',
        'epd.transaction_time as transactionTime',
      ])
      .from(PaymentStatusEntity, 'pse')
      .innerJoin(EasypaisaPaymentDetails, 'epd', 'pse.id = epd.payment_status_id');
  }

  async getEasypaisaPaymentDetails(
    easypaisaPaymentDetailsQuery: EasypaisaPaymentDetailsQueryDto
  ): Promise<EasypaisaPaymentDetailsQueryDto> {
    const { account, transactionAuthId, transactionDate, transactionTime } = easypaisaPaymentDetailsQuery;
    const paymentQueryBuilder = this.easypaisaPaymentDetailsSelectQuery();

    return await paymentQueryBuilder
      .where('pse.account = :account', { account })
      .andWhere('epd.transaction_auth_id = :transactionAuthId', { transactionAuthId })
      .andWhere('epd.transaction_date = :transactionDate', { transactionDate })
      .andWhere('epd.transaction_time = :transactionTime', { transactionTime })
      .getRawOne();
  }
}
