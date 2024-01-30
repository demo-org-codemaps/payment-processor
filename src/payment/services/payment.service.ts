import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
  Logger,
} from '@nestjs/common';
import {
  AppUtil,
  BaseHeadersDto,
  CurrencyCodeEnum,
  HeadersDto,
  IntentStateEnum,
  MapperUtil,
  PaymentActionEnum,
  PaymentImpactEnum,
  PaymentMethodEnum,
  PaymentStateEnum,
  TransactionTypeEnum,
} from '../../shared';
import { DbWrapperService } from './db-wrapper.service';
import { ApiWrapperService } from './api-wrapper.service';
import { CsvHoldDto, HoldDto, MoneyDto, OutDto } from '../dtos';
import { PaymentIntentEntity, PaymentStatusEntity } from '../entities';
import { LogDecorator } from '../../core';
import { Notifications } from '@demoorg/notification-library';
import { IQueueMessage } from '@demoorg/notification-library/build/types/types';
import { TopupCsvArrayDto } from '../dtos/topup-csv.dto';
import { AuthService } from '../../auth';
import { randomUUID } from 'crypto';
import { RollbackDto } from '../dtos/rollback.dto';
import { formatAmount, getTemplateName } from '../../shared/utils/helper.util';
import { PaymentNotificationDto } from '../dtos/payment-notification.dto';
import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { createFile } from '../utils/temp-file.util';
import * as fs from 'fs';
import { decodeJwt } from '../utils/jwt-decoder.util';
import { ConfigService } from '@nestjs/config';
import { SadadIntentDto } from '../dtos/sadad-intent.dto';

import { BillPaymentConfirmationDto } from '../dtos/bill-payment-confirmation.dto';
import { TopupIntentDto } from '../dtos/topup-intent.dto';
import { BillPaymentInquiryDto } from '../dtos/bill-payment-inquiry.dto';
import {
  getRetailerIdFromBillNumber,
  getEasypaisaSuccessResponseData,
  constructEasypaisaPaymentSuccessResponseUtil,
} from '../utils/easypaisa-response.util';
import { EasypaisaResponseDto } from '../dtos/easypaisa-response.dto';
import {
  EasypaisaPaymentBadTransactionException,
  EasypaisaPaymentDuplicateTransactionException,
  EasypaisaPaymentIntentNotFoundException,
  EasypaisaInquiryBadTransactionException,
  EasypaisaInquiryIntentNotFoundException,
  EasypaisaInquiryIntentExpiredException,
  paymentErrorFunctionNames,
  inquiryErrorFunctionNames,
} from '../../shared/exceptions/easypaisa.exception';
import { EasypaisaInquiryDto, EasypaisaIntentDto } from '../dtos/easypaisa-intent.dto';
import { checkIfPKRHasPaisas } from '../utils/currency-validation.util';
import { isNumberString } from 'class-validator';
import { UniqeTransactionDto } from '../dtos/unique-transaction.dto';
import { LmsDataDto } from '../dtos/lms-body.dto';

@Injectable()
export class PaymentService {
  private readonly awsSESEmail: string;
  private emailReceivers: string;
  private readonly awsDefaultRegion: string;
  private readonly easypaisaIntentExpiryDuration: string;

  constructor(
    private readonly apiWrapper: ApiWrapperService,
    private readonly dbWrapper: DbWrapperService,
    private readonly authService: AuthService,
    private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {
    this.awsSESEmail = this.configService.get('AWS_SES_EMAIL');
    this.emailReceivers = this.configService.get('BULK_TOPUP_CC_EMAILS');
    this.awsDefaultRegion = this.configService.get('REGION');
    this.easypaisaIntentExpiryDuration = this.configService.get('EXPIRE_TOPUP_INTENT');
  }

  @LogDecorator()
  async holdProcedure(headers: HeadersDto, body: HoldDto): Promise<PaymentStatusEntity | SadadIntentDto | null> {
    try {
      const { paymentMethod } = body;
      switch (paymentMethod) {
        case PaymentMethodEnum.WALLET:
          return this.holdWallet(headers, body);
        case PaymentMethodEnum.CASH:
          return this.holdCash(headers, body);
        case PaymentMethodEnum.SADAD:
          return this.intentSadad(headers, body);
        default:
          return null;
      }
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async outProcedure(headers: HeadersDto, body: OutDto, action: PaymentActionEnum): Promise<PaymentStatusEntity> {
    try {
      const { idempotencyKey } = headers;
      const { transactionType } = body;
      const holdTransaction = await this.dbWrapper.findByIdempKey(idempotencyKey);
      if (holdTransaction?.state != PaymentStateEnum.COMPLETED)
        throw new BadRequestException(`HOLD was not successful. HOLD it first.`);
      const rollbackdempotencyKey = AppUtil.generateIdempKey(idempotencyKey, PaymentActionEnum.ROLLBACK);
      const rollbackTransaction = await this.dbWrapper.findByIdempKey(rollbackdempotencyKey);
      if (rollbackTransaction) throw new PreconditionFailedException(`This transaction is ROLLEDBACKED`);
      const outIdempotencyKey = AppUtil.generateIdempKey(idempotencyKey, PaymentImpactEnum.OUT);
      let outTransaction = await this.dbWrapper.findByIdempKey(outIdempotencyKey);
      const { currency } = holdTransaction;
      switch (outTransaction?.state) {
        case undefined:
          const { amount, paymentMethod, account } = holdTransaction;
          outTransaction = await this.dbWrapper.createPayment({
            amount,
            account,
            currency,
            paymentMethod,
            idempotencyKey: outIdempotencyKey,
            action,
            impact: PaymentImpactEnum.OUT,
          });
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case PaymentStateEnum.PENDING:
          headers.idempotencyKey = outIdempotencyKey;
          if (action == PaymentActionEnum.RELEASE) {
            const money = new MoneyDto(holdTransaction.amount, holdTransaction.currency);
            await this.apiWrapper.rechargeWallet(headers, {
              ...body,
              money: money,
              retailerId: holdTransaction.account,
            });
            this.sendPushNotification(money, account, transactionType);
          }
          outTransaction = await this.dbWrapper.setPaymentState(outTransaction.id, PaymentStateEnum.COMPLETED);
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case PaymentStateEnum.COMPLETED:
          return outTransaction;
        default:
          break;
      }
    } catch (e) {
      throw e;
    }
  }

  async releaseProcedure(headers: HeadersDto, body: OutDto): Promise<PaymentStatusEntity> {
    return this.outProcedure(headers, body, PaymentActionEnum.RELEASE);
  }

  async chargeProcedure(headers: HeadersDto, body: OutDto): Promise<PaymentStatusEntity> {
    return this.outProcedure(headers, body, PaymentActionEnum.CHARGE);
  }

  @LogDecorator()
  async holdCash(headers: HeadersDto, body: HoldDto): Promise<PaymentStatusEntity> {
    const { idempotencyKey } = headers;
    const { money, paymentMethod } = body;
    if (paymentMethod == PaymentMethodEnum.WALLET) throw new BadRequestException('Incorrect Payment Method');
    let holdTransaction = await this.dbWrapper.findByIdempKey(idempotencyKey);
    switch (holdTransaction?.state) {
      case undefined:
        holdTransaction = await this.dbWrapper.createPayment({ ...body, ...money, idempotencyKey });
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case PaymentStateEnum.PENDING:
        holdTransaction = await this.dbWrapper.setPaymentState(holdTransaction.id, PaymentStateEnum.COMPLETED);
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case PaymentStateEnum.COMPLETED:
        return holdTransaction;
      default:
        break;
    }
  }

  @LogDecorator()
  async holdWallet(headers: HeadersDto, body: HoldDto): Promise<PaymentStatusEntity> {
    const { idempotencyKey } = headers;
    const { money, account, transactionType } = body;
    // if (money.currency != CurrencyCodeEnum.SAR) throw new BadRequestException('PAYMENT_METHOD_NOT_SUPPORTED');
    let subtransaction = await this.dbWrapper.findByIdempKey(idempotencyKey);
    switch (subtransaction?.state) {
      case undefined:
        const balance = await this.apiWrapper.fetchCoinBalance(headers, account, money.currency);
        if (balance.lessThan(money)) throw new PreconditionFailedException('INSUFFICIENT_BALANCE');
        subtransaction = await this.dbWrapper.createPayment({ ...body, ...money, idempotencyKey });
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case PaymentStateEnum.PENDING:
        await this.apiWrapper.chargeWallet(headers, {
          ...body,
          retailerId: body.account,
        });
        subtransaction = await this.dbWrapper.setPaymentState(subtransaction.id, PaymentStateEnum.COMPLETED);
        this.sendPushNotification(money, account, transactionType);
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case PaymentStateEnum.COMPLETED:
        return subtransaction;
      default:
        // It should not get here
        break;
    }
  }

  @LogDecorator()
  async intentSadad(headers: HeadersDto, body: HoldDto): Promise<SadadIntentDto> {
    const { idempotencyKey } = headers;
    const { money, account } = body;
    const user = await this.apiWrapper.fetchUser(headers, account);
    let intent = await this.getPaymentIntentDetails(idempotencyKey);
    switch (intent?.state) {
      case undefined:
        const billNumber = idempotencyKey.substring(0, 20);
        const { sadadNumber } = await this.apiWrapper.createSadadIntent(user, money, billNumber);
        const paymentIntentEntity = await this.dbWrapper.createIntent({
          ...body,
          ...money,
          idempotencyKey,
        });
        await this.dbWrapper.createIntentDetails({
          sadadNumber,
          billNumber,
          paymentIntentId: paymentIntentEntity,
        });
        intent = await this.getPaymentIntentDetails(idempotencyKey);
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case IntentStateEnum.PENDING:
      case IntentStateEnum.COMPLETED:
      case IntentStateEnum.CANCELLED:
        return intent;
      default:
        break;
    }
  }

  @LogDecorator()
  async sadadNotification(body: PaymentNotificationDto): Promise<any> {
    try {
      const { paymentStatus, sadadNumber } = body;
      if (paymentStatus == 'APPROVED') {
        const intent = await this.getPaymentIntentDetailsBySadadNumber(sadadNumber);
        switch (intent?.state) {
          case undefined:
          case IntentStateEnum.CANCELLED:
            throw new NotFoundException();
          case IntentStateEnum.PENDING:
            await this.dbWrapper.completePaymentIntent(sadadNumber, JSON.stringify(body));
          // falls through deliberatlely without break and "falls through" comment allows us to do that
          case IntentStateEnum.COMPLETED:
            await this.apiWrapper.notifyPaymentOwner(intent.idempotencyKey);
          default:
            break;
        }
      }
      return {
        status: 200,
        message: 'Operation Done Successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @LogDecorator()
  async rollbackProcedure(
    headers: HeadersDto,
    body: RollbackDto
  ): Promise<{
    rollbackTransaction: PaymentStatusEntity;
    isReleased: boolean;
  }> {
    try {
      const { idempotencyKey } = headers;
      const { adjustedMoney, transactionType } = body;
      const outIdempotencyKey = AppUtil.generateIdempKey(idempotencyKey, PaymentImpactEnum.OUT);
      const outTransaction = await this.dbWrapper.findByIdempKey(outIdempotencyKey);
      if (!outTransaction) return;
      const { action, state, paymentMethod, amount, currency, account } = outTransaction;

      if (state == PaymentStateEnum.PENDING)
        throw new PreconditionFailedException(`CHARGE was not successful. CHARGE it first.`);
      const rollbackdempotencyKey = AppUtil.generateIdempKey(idempotencyKey, PaymentActionEnum.ROLLBACK);
      let rollbackTransaction = await this.dbWrapper.findByIdempKey(rollbackdempotencyKey);
      switch (rollbackTransaction?.state) {
        case undefined:
          rollbackTransaction = await this.dbWrapper.createPayment({
            amount,
            account,
            currency,
            paymentMethod,
            idempotencyKey: rollbackdempotencyKey,
            action: PaymentActionEnum.ROLLBACK,
            impact: PaymentImpactEnum.OUT,
          });
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case PaymentStateEnum.PENDING:
          if (rollbackTransaction && paymentMethod !== PaymentMethodEnum.CASH && action !== PaymentActionEnum.RELEASE) {
            const money = adjustedMoney.isPositive() ? adjustedMoney : new MoneyDto(amount, currency);
            headers.idempotencyKey = rollbackdempotencyKey;
            await this.apiWrapper.rechargeWallet(headers, {
              transactionType: TransactionTypeEnum.ORDER_REFUND,
              money: money,
              retailerId: account,
            });
            this.sendPushNotification(money, account, transactionType);
          }
          rollbackTransaction = await this.dbWrapper.setPaymentState(
            rollbackTransaction.id,
            PaymentStateEnum.COMPLETED
          );
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case PaymentStateEnum.COMPLETED:
          return {
            rollbackTransaction,
            isReleased: !!(action === PaymentActionEnum.RELEASE),
          };
        default:
          break;
      }
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async topUpProcedure(headers: HeadersDto, body: HoldDto): Promise<PaymentStatusEntity> {
    try {
      const { idempotencyKey } = headers;
      const { paymentMethod, account, transactionType } = body;
      if (paymentMethod == PaymentMethodEnum.WALLET) throw new BadRequestException('Incorrect Payment Method');
      await this.apiWrapper.fetchUser(headers, account); // throws error if user is not found
      const holdTransaction = await this.holdCash(headers, body);
      const outIdempotencyKey = AppUtil.generateIdempKey(idempotencyKey, PaymentImpactEnum.OUT);
      let outTransaction = await this.dbWrapper.findByIdempKey(outIdempotencyKey);
      const { currency } = holdTransaction;
      switch (outTransaction?.state) {
        case undefined:
          const { amount, paymentMethod, account } = holdTransaction;
          outTransaction = await this.dbWrapper.createPayment({
            amount,
            currency,
            paymentMethod,
            account,
            ...body,
            idempotencyKey: outIdempotencyKey,
            action: PaymentActionEnum.RELEASE,
            impact: PaymentImpactEnum.OUT,
          });
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case PaymentStateEnum.PENDING:
          headers.idempotencyKey = outIdempotencyKey;
          const money = new MoneyDto(holdTransaction.amount, holdTransaction.currency);
          await this.apiWrapper.rechargeWallet(headers, {
            ...body,
            money: money,
            retailerId: holdTransaction.account,
          });
          outTransaction = await this.dbWrapper.setPaymentState(outTransaction.id, PaymentStateEnum.COMPLETED);
          this.sendPushNotification(money, holdTransaction.account, transactionType);
          return outTransaction;
        case PaymentStateEnum.COMPLETED:
          return outTransaction;
        default:
          break;
      }
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async bulkWalletAdjustment(headers: BaseHeadersDto, { topups }: TopupCsvArrayDto): Promise<any> {
    const modHeaders = new HeadersDto();
    modHeaders.authorization = await this.authService.generateServiceToken(headers.authorization);
    modHeaders.language = headers.language;
    const errors = {};
    for (const [index, topup] of topups.entries()) {
      modHeaders.idempotencyKey = randomUUID();
      try {
        const action = AppUtil.getActionByType(topup.transactionType);
        const holdSubtransaction =
          action == PaymentActionEnum.RELEASE
            ? await this.holdCash(modHeaders, topup)
            : await this.holdWallet(modHeaders, topup);
        modHeaders.idempotencyKey = holdSubtransaction.idempotencyKey;
        await this.outProcedure(modHeaders, topup, action);
      } catch (err) {
        console.log(err);
        errors[index] = { error: [err.response ? err.response.data ?? err?.response : err] }; // To match error response
      }
    }
    await this.exportAndEmailBulkTopupCSV(headers, topups, errors);
    return errors;
  }

  @LogDecorator()
  async cancel3PIntent(idempotencyKey: string): Promise<PaymentIntentEntity> {
    let intent = await this.dbWrapper.findIntentByIdempKey(idempotencyKey);
    switch (intent?.state) {
      case IntentStateEnum.PENDING:
        await this.apiWrapper.cancelSadadIntent(idempotencyKey.substring(0, 20));
        intent = await this.dbWrapper.cancelPaymentIntent(idempotencyKey);
      case IntentStateEnum.CANCELLED:
        return intent;
      case IntentStateEnum.COMPLETED:
        throw new PreconditionFailedException('PAYMENT_IN_HOLD');
      default:
        return;
    }
  }

  @LogDecorator()
  async cancelProcedure(headers: HeadersDto, body: OutDto): Promise<PaymentStatusEntity | PaymentIntentEntity> {
    const { idempotencyKey } = headers;
    const holdTransaction = await this.dbWrapper.findByIdempKey(idempotencyKey);
    if (!holdTransaction) {
      return await this.cancel3PIntent(idempotencyKey);
    } else {
      return await this.releaseProcedure(headers, body);
    }
  }

  @LogDecorator()
  async fetchIntentStatus(headers: HeadersDto): Promise<SadadIntentDto> {
    const { idempotencyKey } = headers;
    let intent = await this.getPaymentIntentDetails(idempotencyKey);
    if (intent?.state == IntentStateEnum.PENDING) {
      try {
        const info = await this.apiWrapper.fetchSadadIntent(idempotencyKey.substring(0, 20));
        const convInfo = MapperUtil.map(PaymentNotificationDto, info);
        if (info?.statusCode == 'PAID_BY_SADAD') {
          await this.dbWrapper.completePaymentIntent(info?.sadadNumber, JSON.stringify(convInfo));
          intent = await this.getPaymentIntentDetails(idempotencyKey);
        }
      } catch (err) {
        this.logger.error(
          `error from fetchSadadIntent, returning locally stored intent. Error >>> ${err.message}`,
          err.stack
        );
        return intent;
      }
    }
    return intent;
  }

  @LogDecorator({ throwError: false })
  async sendPushNotification(money: MoneyDto, account: string, transactionType: TransactionTypeEnum) {
    const amount = formatAmount({ ...money.toJSON() });
    const templateName = getTemplateName(transactionType);
    const args = { ...money.toJSON(), amount };
    const userData: IQueueMessage = {
      customerId: [parseInt(account)],
      templateName: templateName,
      language: 'EN',
      sender: 'notification-library',
      args: args,
    };
    await Notifications.sendMessage(userData);
  }

  @LogDecorator()
  async performDynamicValidation(headers: any, { topups }: TopupCsvArrayDto) {
    const errors = [];
    const promises = [];
    topups.forEach(item => {
      promises.push(this.apiWrapper.fetchUser(headers, item.account));
    });

    const responses = await Promise.allSettled(promises);
    for (const [index, response] of responses.entries()) {
      if (response.status !== 'fulfilled') {
        errors.push({
          rowNum: index + 1,
          error: [{ message: 'Customer Not Found', code: '204' }], // To match error response
        });
      }
    }

    return errors;
  }

  @LogDecorator()
  async sendSESRawEmail(receiver: string, subject: string, attachment: any, attachmentType: string) {
    const date = new Date();
    const receiverEmails: string[] = this.emailReceivers.split(';');
    const client = new SESClient({ region: this.awsDefaultRegion });

    // if receiver is not null
    if (receiver) {
      receiverEmails.push(receiver);
    }

    const msg = `From:${this.awsSESEmail}
To:${receiver ? receiver : receiverEmails[0]}
Subject: ${subject}
Content-Type: text/csv; name="bulk-topup-export-${date.toISOString()}.${attachmentType}";
Content-Disposition: attachment;filename="bulk-topup-export-${date.toISOString()}.${attachmentType}"
Creation-date="${new Date()}";
Content-Transfer-Encoding: base64
${attachment}`;

    try {
      await client.send(
        new SendRawEmailCommand({
          Source: this.awsSESEmail,
          Destinations: receiverEmails,
          RawMessage: { Data: new TextEncoder().encode(msg) },
        })
      );
    } catch (e) {
      throw new InternalServerErrorException('Error while sending email using SES');
    }
  }

  @LogDecorator()
  async exportAndEmailBulkTopupCSV(headers: BaseHeadersDto, topups: CsvHoldDto[], errors: any) {
    const receiver = decodeJwt(headers.authorization).email;
    const file = createFile('csv', 'bulk-topup');
    await fs.appendFileSync(file.name, 'Retailer Id, Amount, Currency, Transaction Type, Status\n');
    const promises = [];

    for (const [index, topup] of topups.entries()) {
      promises.push(
        fs.promises.appendFile(
          file.name,
          `${topup.account},${topup.money.amount},${topup.money.currency},${topup.transactionType}, ${
            errors[index] ? 'FAILURE' : 'SUCCESS'
          }\n`
        )
      );
    }
    Promise.all(promises)
      .then(() => {
        fs.readFile(file.name, async (err, data) => {
          if (err) {
            throw new InternalServerErrorException();
          } else {
            await this.sendSESRawEmail(receiver, 'Bulk Topup Report', data, 'csv');
          }
        });
      })
      .finally(() => {
        // removing temporary file
        file.removeCallback();
      });
  }

  async getPaymentIntentDetails(idempotencyKey: string): Promise<SadadIntentDto> {
    const intent = await this.dbWrapper.getPaymentIntentDetailsByIdempKey(idempotencyKey);
    if (intent) {
      return MapperUtil.map(SadadIntentDto, intent);
    }
    return undefined;
  }

  async getPaymentIntentDetailsBySadadNumber(sadadNumber: string): Promise<SadadIntentDto> {
    const intent = await this.dbWrapper.getPaymentIntentDetailsBySadadNumber(sadadNumber);
    if (intent) {
      return MapperUtil.map(SadadIntentDto, intent);
    }
    return undefined;
  }

  @LogDecorator()
  async createTopupIntent(headers: HeadersDto, dto: TopupIntentDto): Promise<EasypaisaIntentDto> {
    const { total, paymentMethod } = dto;
    const { idempotencyKey } = headers;

    //if no retailer id throw error
    const account = decodeJwt(headers.authorization).id;

    if (!account) {
      throw new BadRequestException('Retailer id does not exist');
    }

    const pendingIntent = await this.dbWrapper.findTopupIntentByIdempKey(idempotencyKey);
    if (!pendingIntent) {
      if (checkIfPKRHasPaisas(total.amount)) {
        throw new BadRequestException('Amount should not contain minor denomination');
      }

      const allPendingIntents = await this.dbWrapper.getPendingEasypaisaIntentsByBillNumber(`WT${account}`);
      if (allPendingIntents.length > 0) {
        await this.dbWrapper.updateWalletTopupIntentStatesByAccount(account, IntentStateEnum.CANCELLED);
      }

      //WT + retailerId is bill number
      const billNumber = `WT${account}`;
      const walletTopupIntent = await this.dbWrapper.createEasypaisaPaymentIntent(
        {
          ...total,
          paymentMethod,
          account,
          state: IntentStateEnum.PENDING,
          idempotencyKey,
        },
        billNumber
      );
      return MapperUtil.map(EasypaisaIntentDto, walletTopupIntent);
    }
    return MapperUtil.map(EasypaisaIntentDto, pendingIntent);
  }

  async fetchTopupIntent(retailerId: string): Promise<any> {
    const topupIntents = await this.dbWrapper.getValidEasypaisaIntent(retailerId, IntentStateEnum.PENDING);
    if (topupIntents.length > 1) {
      throw new BadRequestException('MORE_THAN_ONE_INTENT_EXISTS');
    } else if (topupIntents.length == 1) {
      return MapperUtil.map(EasypaisaIntentDto, topupIntents[0]);
    } else {
      return {};
    }
  }

  async getUser(retailerId: string, providedToken?: string) {
    let token = providedToken;
    if (!token) {
      token = await this.authService.generateServiceToken();
    }
    const headers = new HeadersDto();
    headers.authorization = token;
    try {
      return await this.apiWrapper.fetchUser(headers, retailerId);
    } catch (e) {
      //if user does not exist
      throw new EasypaisaInquiryIntentNotFoundException();
    }
  }

  async checkDuplicateTransactionForEasypaisa(body: UniqeTransactionDto) {
    const { transactionAuthId, transactionDate, transactionTime, account, billNumber } = body;
    // checking for duplication
    const duplicateEntry = await this.dbWrapper.getEasypaisaPaymentDetails({
      account: account ? account : getRetailerIdFromBillNumber(billNumber),
      transactionAuthId,
      transactionDate,
      transactionTime,
    });

    if (duplicateEntry) {
      throw new EasypaisaPaymentDuplicateTransactionException();
    }
  }

  async walletTopupInquiryForEasypaisa(billNumber: string) {
    //get retailer id from consumer number
    const retailerId = getRetailerIdFromBillNumber(billNumber);

    //get user name data
    let user;
    let topupIntent: EasypaisaIntentDto;
    try {
      user = await this.getUser(retailerId);

      //fetch last intent against retailerId
      topupIntent = await this.dbWrapper.getRecentEasypaisaIntent(retailerId);

      if (!topupIntent) {
        throw new EasypaisaInquiryIntentNotFoundException();
      } else if (topupIntent.state === IntentStateEnum.COMPLETED) {
        const { amount, transactionAuthId, transactionDate } = await this.dbWrapper.getEasypaisaTransactionData(
          topupIntent.idempotencyKey
        );
        return getEasypaisaSuccessResponseData(
          topupIntent,
          {
            consumerDetail: user.name,
            responseCode: '00',
            billStatus: 'P',
            transactionAuthId,
            amountPaid: amount,
            datePaid: transactionDate,
          } as EasypaisaInquiryDto,
          parseInt(this.easypaisaIntentExpiryDuration)
        );
      } else if (topupIntent.state === IntentStateEnum.PENDING) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() - parseInt(this.easypaisaIntentExpiryDuration));
        const intentCreationDate = new Date(topupIntent.createdAt);
        if (intentCreationDate > expDate) {
          return getEasypaisaSuccessResponseData(
            topupIntent,
            {
              consumerDetail: user.name,
              responseCode: '00',
              billStatus: 'U',
            } as EasypaisaInquiryDto,
            parseInt(this.easypaisaIntentExpiryDuration)
          );
        } else {
          throw new EasypaisaInquiryIntentExpiredException();
        }
      }
    } catch (e) {
      if (inquiryErrorFunctionNames.includes(e?.name)) {
        throw e;
      }
      throw new EasypaisaInquiryBadTransactionException();
    }
  }

  async walletTopupConfirmationForEasypaisa(body: BillPaymentConfirmationDto) {
    const { billNumber, transactionAuthId, transactionAmount, transactionDate, transactionTime, reserved } = body;

    try {
      //check for duplicate transaction
      await this.checkDuplicateTransactionForEasypaisa(MapperUtil.map(UniqeTransactionDto, body));

      // fetching intent using the billNumber
      const intentsArray = await this.dbWrapper.getPendingEasypaisaIntentsByBillNumber(billNumber);

      if (intentsArray.length === 0) {
        throw new EasypaisaPaymentIntentNotFoundException();
      }

      if (intentsArray.length > 1) {
        // multiple valid intents found
        throw new EasypaisaPaymentBadTransactionException();
      }

      // fetching intent
      const intent = intentsArray[0];
      const { idempotencyKey, account: retailerId } = intent;

      // amount equality validation
      if (parseInt(transactionAmount) !== intent.amount) {
        throw new EasypaisaPaymentBadTransactionException();
      }

      // check to validate against amount in minor denomination
      if (checkIfPKRHasPaisas(parseInt(transactionAmount)) || checkIfPKRHasPaisas(intent.amount)) {
        throw new EasypaisaPaymentBadTransactionException();
      }

      // checking if the transaction is duplicate
      const duplicatePaymentStatusEntry = await this.dbWrapper.findByIdempKey(idempotencyKey);
      let walletTopupTransaction: PaymentStatusEntity;

      if (!duplicatePaymentStatusEntry) {
        /*
         * if entry exists in PaymentStatusEntity and is absent in EasypaisaPaymentDetails
         * this case is triggered when wallet recharge fails without updating the intent's
         * state to complete, resulting in a redundant entry in PaymentStatusEntity
         */

        // storing transaction record in paymentStatusEntity
        walletTopupTransaction = await this.dbWrapper.createPayment({
          action: PaymentActionEnum.HOLD,
          impact: PaymentImpactEnum.IN,
          amount: parseInt(transactionAmount),
          currency: CurrencyCodeEnum.PKR,
          paymentMethod: PaymentMethodEnum.EASYPAISA,
          account: retailerId,
          state: PaymentStateEnum.PENDING,
          idempotencyKey: idempotencyKey,
        });
      }

      const header = new HeadersDto();
      header.authorization = await this.authService.generateServiceToken('');
      header.idempotencyKey = idempotencyKey;

      // creating money dto to top up the wallet
      const money = new MoneyDto(parseInt(transactionAmount), CurrencyCodeEnum.PKR);

      // making recharge call to top up the wallet
      await this.apiWrapper.rechargeWallet(header, {
        retailerId: retailerId,
        money: money,
        transactionType: TransactionTypeEnum.EASYPAISA_SELF_TOPUP,
      });

      // updating intent state to COMPLETED in paymentIntentEntity
      await this.dbWrapper.setIntentState(intent.id, IntentStateEnum.COMPLETED);

      // storing transaction data in easypaisaPaymentDetails
      await this.dbWrapper.createEasypaisaPaymentDetails({
        transactionAuthId,
        transactionDate,
        transactionTime,
        transactionId: reserved,
        paymentStatusId: walletTopupTransaction ? walletTopupTransaction : duplicatePaymentStatusEntry,
      });

      // updating the paymentStatusEntity record to set state to COMPLETED and action to RELEASE
      await this.dbWrapper.updatePaymentStatusEntity(
        walletTopupTransaction ? walletTopupTransaction.id : duplicatePaymentStatusEntry.id,
        {
          state: PaymentStateEnum.COMPLETED,
          action: PaymentActionEnum.RELEASE,
          impact: PaymentImpactEnum.OUT,
        }
      );

      return constructEasypaisaPaymentSuccessResponseUtil({
        responseCode: '00',
        identificationParameter: `consumer number ${billNumber} paid`,
        reserved: 'payment successful',
      } as EasypaisaResponseDto);
    } catch (e) {
      if (paymentErrorFunctionNames.includes(e?.name)) {
        throw e;
      }
      throw new EasypaisaPaymentBadTransactionException();
    }
  }

  //billnumber passed is order ID in this case
  async loanPaymentInquiryForEasypaisa(orderId: string) {
    try {
      const token = await this.authService.generateServiceToken();
      const headers = new HeadersDto();
      headers.authorization = token;

      //check existing completed payments against this billnumber i.e orderId
      const loanPayment = await this.dbWrapper.getEasypaisaIntent(orderId, IntentStateEnum.COMPLETED);

      //if already paid send success response to EP
      if (loanPayment) {
        const { idempotencyKey, account, amount, createdAt } = loanPayment;
        const { transactionAuthId, transactionId, transactionDate } = await this.dbWrapper.getEasypaisaTransactionData(
          idempotencyKey
        );
        const { name } = await this.getUser(account.toString(), headers.authorization);
        const topupIntent = new EasypaisaIntentDto();
        topupIntent.amount = amount;
        topupIntent.createdAt = createdAt.toString();
        return getEasypaisaSuccessResponseData(
          topupIntent,
          {
            consumerDetail: name,
            responseCode: '00',
            billStatus: 'P',
            transactionAuthId: transactionAuthId,
            amountPaid: topupIntent.amount,
            datePaid: transactionDate,
            reserved: transactionId,
          } as unknown as EasypaisaInquiryDto,
          parseInt(this.easypaisaIntentExpiryDuration)
        );
      }

      //fetch user liability by orderID
      const { retailerId, remaingLiabilityAmount, currency } = await this.apiWrapper.fetchLiabilityByOrderId(
        headers,
        orderId
      );
      const { amount } = MapperUtil.map(MoneyDto, { amount: parseInt(remaingLiabilityAmount), currency });
      if (currency === CurrencyCodeEnum.PKR && amount > 0) {
        const { name } = await this.getUser(retailerId.toString(), headers.authorization);
        const date = new Date();
        const topupIntent = new EasypaisaIntentDto();
        topupIntent.amount = amount;
        topupIntent.createdAt = date.toString();
        return getEasypaisaSuccessResponseData(
          topupIntent,
          {
            consumerDetail: name,
            responseCode: '00',
            billStatus: 'U',
          } as EasypaisaInquiryDto,
          parseInt(this.easypaisaIntentExpiryDuration)
        );
      } else {
        throw new EasypaisaInquiryIntentNotFoundException('no liability exists against this consumer number');
      }
    } catch (e) {
      //customer msg is being sent in error if amount is zero or invalid currency
      if (inquiryErrorFunctionNames.includes(e?.name)) {
        throw e;
      }
      //do not throw error again, return data of already thrown error
      const statusCode = e?.response?.data?.statusCode;
      const validationFailures = e?.response?.data?.validationFailures;
      if (statusCode && validationFailures) {
        throw new EasypaisaInquiryIntentNotFoundException(validationFailures); //LMS api send and error while fetching liability
      }
      throw new EasypaisaInquiryBadTransactionException(); //generic error
    }
  }

  async loanPaymentConfirmationForEasypaisa(body: BillPaymentConfirmationDto) {
    const { billNumber, transactionAmount, transactionAuthId, transactionDate, transactionTime, reserved } = body;

    try {
      const idempotencyKey = randomUUID();
      const total = new MoneyDto(parseInt(transactionAmount), CurrencyCodeEnum.PKR);
      const token = await this.authService.generateServiceToken();
      const headers = new HeadersDto();
      headers.authorization = token;

      const { retailerId, remaingLiabilityAmount } = await this.apiWrapper.fetchLiabilityByOrderId(headers, billNumber);

      if (parseInt(remaingLiabilityAmount) != total.toJSON().amount) {
        throw new EasypaisaPaymentBadTransactionException();
      }

      //check duplicateTransaction
      await this.checkDuplicateTransactionForEasypaisa(
        MapperUtil.map(UniqeTransactionDto, { ...body, account: retailerId })
      );

      //check pending intent else create new
      let easypaisaIntent = await this.dbWrapper.getEasypaisaIntent(billNumber, IntentStateEnum.PENDING);
      if (!easypaisaIntent) {
        easypaisaIntent = await this.dbWrapper.createEasypaisaPaymentIntent(
          {
            ...total,
            paymentMethod: PaymentMethodEnum.EASYPAISA,
            account: retailerId.toString(),
            state: IntentStateEnum.PENDING,
            idempotencyKey,
          },
          billNumber
        );
      }

      //create HOLD pending state entry in ledger, storing transaction record in paymentStatusEntity
      let paymentStatusEntity = await this.dbWrapper.findByIdempKey(easypaisaIntent.idempotencyKey);
      if (!paymentStatusEntity) {
        paymentStatusEntity = await this.dbWrapper.createPayment({
          action: PaymentActionEnum.HOLD,
          impact: PaymentImpactEnum.IN,
          amount: parseInt(transactionAmount),
          currency: CurrencyCodeEnum.PKR,
          paymentMethod: PaymentMethodEnum.EASYPAISA,
          account: retailerId.toString(),
          state: PaymentStateEnum.PENDING,
          idempotencyKey: easypaisaIntent.idempotencyKey,
        });
      }
      const lmsSettleData = [
        {
          retailerId,
          repaymentAmount: total.toJSON().amount,
          currencyCode: CurrencyCodeEnum.PKR,
          orderId: Number(billNumber),
          loanRepaymentMethod: PaymentMethodEnum.EASYPAISA,
        } as LmsDataDto,
      ];

      //call the settle api of LMS
      const lmsResponse = await this.apiWrapper.settleLiabilityAgainstOrder(headers, lmsSettleData);

      //if success from LMS then do processing on your side
      if (lmsResponse?.success) {
        // updating intent state to COMPLETED in paymentIntentEntity
        await this.dbWrapper.setIntentState(easypaisaIntent.id, IntentStateEnum.COMPLETED);

        // updating the paymentStatusEntity record to set state to COMPLETED and action to RELEASE
        await this.dbWrapper.updatePaymentStatusEntity(paymentStatusEntity.id, {
          state: PaymentStateEnum.COMPLETED,
          action: PaymentActionEnum.CHARGE,
          impact: PaymentImpactEnum.OUT,
        });

        //create easypaisa payment details
        await this.dbWrapper.createEasypaisaPaymentDetails({
          transactionAuthId,
          transactionDate,
          transactionTime,
          transactionId: reserved,
          paymentStatusId: paymentStatusEntity,
        });

        //respond to easypaisa
        return constructEasypaisaPaymentSuccessResponseUtil({
          responseCode: '00',
          identificationParameter: `consumer number ${billNumber} paid`,
          reserved: 'payment successful',
        } as EasypaisaResponseDto);
      } else {
        throw new EasypaisaPaymentBadTransactionException('no success recevied from lms');
      }
    } catch (e) {
      //currency or amount validation failed
      if (paymentErrorFunctionNames.includes(e?.name)) {
        throw e;
      }
      //LMS api send and error while fetching liability
      const statusCode = e?.response?.data?.statusCode;
      const validationFailures = e?.response?.data?.validationFailures;
      if (statusCode && validationFailures) {
        throw new EasypaisaPaymentBadTransactionException(validationFailures);
      }
      //generic error
      throw new EasypaisaPaymentBadTransactionException();
    }
  }

  async billPaymentConfirmation(body: BillPaymentConfirmationDto) {
    const { billNumber } = body;

    //wallet topup flow
    if (billNumber.startsWith('WT')) {
      return this.walletTopupConfirmationForEasypaisa(body);
    }
    //loan payment for order flow
    else if (isNumberString(billNumber)) {
      return this.loanPaymentConfirmationForEasypaisa(body);
    }
    //should not get here
    else {
      throw new EasypaisaPaymentIntentNotFoundException();
    }
  }

  async billPaymentInquiry(body: BillPaymentInquiryDto): Promise<any> {
    const { billNumber } = body;

    //wallet topup flow
    if (billNumber.startsWith('WT')) {
      return this.walletTopupInquiryForEasypaisa(billNumber);
    }
    //loan payment for order flow
    else if (isNumberString(billNumber)) {
      return this.loanPaymentInquiryForEasypaisa(billNumber);
    }
    //should not get here
    else {
      throw new EasypaisaInquiryIntentNotFoundException();
    }
  }
}
