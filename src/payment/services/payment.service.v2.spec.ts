import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HeadersDto, CurrencyCodeEnum, PaymentMethodEnum, TransactionTypeEnum } from '../../shared';
import { MoneyDto, TopupCsvArrayDto } from '../dtos';
import { ApiWrapperService } from './api-wrapper.service';
import { DbWrapperService } from './db-wrapper.service';
import { AuthService } from '../../auth';
import { PaymentService } from './payment.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SESClient } from '@aws-sdk/client-ses';
import { configModuleOptions } from '../../core';

jest.spyOn(PaymentService.prototype, 'sendPushNotification').mockImplementation();

describe('PaymentService-performDynamicValidation', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {};
  const mockApiWrapperService = {
    fetchUser: jest.fn(() => {
      return {
        id: 'id',
        name: 'name',
        phone: 'phone',
        email: 'email',
        businessUnitId: '1',
      };
    }),
  };
  const mockAuthService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        ConfigService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
      imports: [ConfigModule.forRoot(configModuleOptions)],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('performDynamicValidation', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency_17321';
    headerDto.language = 'english';

    const topupArray = new TopupCsvArrayDto();
    topupArray.topups = [
      {
        account: '105445',
        money: new MoneyDto(250, CurrencyCodeEnum.PKR),
        paymentMethod: PaymentMethodEnum.CASH,
        transactionType: TransactionTypeEnum.PROMOTIONAL_TOPUP,
        comments: 'test',
      },
    ];

    it('should return empty array', async () => {
      const res = [];
      expect(await paymentService.performDynamicValidation(headerDto, topupArray)).toEqual(res);
    });
  });
});

describe('PaymentService-sendSESRawEmail', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {};
  const mockApiWrapperService = {
    fetchUser: jest.fn(() => {
      return {
        id: 'id',
        name: 'name',
        phone: 'phone',
        email: 'email',
        businessUnitId: '1',
      };
    }),
  };
  const mockAuthService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        ConfigService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
      imports: [ConfigModule.forRoot(configModuleOptions)],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('performDynamicValidation', () => {
    jest.spyOn(SESClient.prototype, 'send').mockImplementation();
    it('should return nothing', async () => {
      expect(await paymentService.sendSESRawEmail('msiddiq17325@gmail.com', 'subject', 'hello', 'string'));
    });
  });
});
