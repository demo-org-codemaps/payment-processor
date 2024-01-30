import { Test } from '@nestjs/testing';
import {
  CurrencyCodeEnum,
  HeadersDto,
  PaymentActionEnum,
  PaymentImpactEnum,
  PaymentMethodEnum,
  PaymentStateEnum,
  TransactionTypeEnum,
} from '../../shared';
import { MoneyDto, HoldDto, OutDto } from '../dtos';
import { RollbackDto } from '../dtos/rollback.dto';
import { PaymentService } from '../services';
import { PaymentController } from './payment.controller';
import { HealthCheckService } from '@nestjs/terminus';

const headersDto = new HeadersDto();
headersDto.authorization = 'authorization';
headersDto.idempotencyKey = 'idempotency-key';
headersDto.language = 'english';

describe('PaymentController', () => {
  let paymentController: PaymentController;

  const paymentStatusEntity = {
    id: 'id',
    action: PaymentActionEnum.HOLD,
    impact: PaymentImpactEnum.IN,
    amount: 100,
    currency: CurrencyCodeEnum.PKR,
    paymentMethod: PaymentMethodEnum.WALLET,
    account: 'account',
    state: PaymentStateEnum.COMPLETED,
    idempotencyKey: 'idempotencyKey-2',
    toJSON: function () {
      return { amount: 45, currency: 'PKR' };
    },
  };

  const mockHealthCheckService = {
    check: jest.fn(() => {
      return true;
    }),
  };

  const mockPaymentService = {
    holdProcedure: jest.fn(() => {
      return paymentStatusEntity;
    }),

    releaseProcedure: jest.fn(() => {
      return paymentStatusEntity;
    }),

    chargeProcedure: jest.fn(() => {
      return paymentStatusEntity;
    }),

    rollbackProcedure: jest.fn(() => {
      return {
        isReleased: true,
        rollbackTransaction: {
          ...paymentStatusEntity,
        },
      };
    }),

    topUpProcedure: jest.fn(() => {
      return paymentStatusEntity;
    }),

    calculateCashAmount: jest.fn(() => {
      return new MoneyDto(56, CurrencyCodeEnum.PKR);
    }),

    calculateBatchCashAmounts: jest.fn(() => {
      return { 'order-id-1': { amount: 0, currency: 'PKR' } };
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [PaymentService, { provide: HealthCheckService, useValue: mockHealthCheckService }],
    })
      .overrideProvider(PaymentService)
      .useValue(mockPaymentService)
      .compile();

    paymentController = moduleRef.get<PaymentController>(PaymentController);
  });

  describe('hold', () => {
    const res = {
      data: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
    };

    const holdDto = new HoldDto();
    holdDto.account = 'account';
    holdDto.comments = 'comments';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return transaction id', async () => {
      expect(await paymentController.hold(headersDto, holdDto)).toEqual(res);
    });
  });

  describe('release', () => {
    const res = {
      data: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
    };

    const outDto = new OutDto();
    outDto.comments = 'comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return transaction id', async () => {
      expect(await paymentController.release(headersDto, outDto)).toEqual(res);
    });
  });

  describe('charge', () => {
    const res = {
      data: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
    };

    const outDto = new OutDto();
    outDto.comments = 'comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return transaction id', async () => {
      expect(await paymentController.charge(headersDto, outDto)).toEqual(res);
    });
  });

  describe('rollback', () => {
    const res = {
      data: {
        isReleased: expect.any(Boolean),
        transaction: {
          amount: expect.any(Number),
          currency: expect.any(String),
        },
      },
    };

    it('should return transaction id', async () => {
      const rollbackDto = new RollbackDto();
      rollbackDto.comments = 'comments';
      rollbackDto.transactionType = TransactionTypeEnum.ORDER_REFUND;
      expect(await paymentController.rollback(headersDto, rollbackDto)).toEqual(res);
    });
  });

  describe('topUp', () => {
    const res = {
      data: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
    };

    const holdDto = new HoldDto();
    holdDto.account = 'account';
    holdDto.comments = 'comments';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return transaction id', async () => {
      expect(await paymentController.topUp(headersDto, holdDto)).toEqual(res);
    });
  });
});
