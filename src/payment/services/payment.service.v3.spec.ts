import { Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  HeadersDto,
  CurrencyCodeEnum,
  PaymentMethodEnum,
  TransactionTypeEnum,
  PaymentActionEnum,
  PaymentImpactEnum,
  PaymentStateEnum,
  IntentStateEnum,
} from '../../shared';
import { MoneyDto, TopupCsvArrayDto } from '../dtos';
import { ApiWrapperService } from './api-wrapper.service';
import { DbWrapperService } from './db-wrapper.service';
import { AuthService } from '../../auth';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { TopupIntentDto } from '../dtos/topup-intent.dto';
import { BillPaymentInquiryDto } from '../dtos/bill-payment-inquiry.dto';
import {
  EasypaisaInquiryIntentNotFoundException,
  EasypaisaPaymentBadTransactionException,
  EasypaisaPaymentDuplicateTransactionException,
  EasypaisaPaymentIntentNotFoundException,
} from '../../shared/exceptions/easypaisa.exception';
import * as jwtUtil from '../utils/jwt-decoder.util';

jest.spyOn(PaymentService.prototype, 'sendPushNotification').mockImplementation();

const findByIdempKeyObject = {
  action: PaymentActionEnum.HOLD,
  impact: PaymentImpactEnum.IN,
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  account: 'account',
  state: PaymentStateEnum.COMPLETED,
  idempotencyKey: 'idempotencyKey-2',
};

const setPaymentsStateObject = {
  action: PaymentActionEnum.HOLD,
  impact: PaymentImpactEnum.IN,
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  account: 'account',
  state: PaymentStateEnum.COMPLETED,
  idempotencyKey: 'idempotencyKey-3',
};

const createPaymentObject = {
  action: PaymentActionEnum.HOLD,
  impact: PaymentImpactEnum.IN,
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  account: 'account',
  state: PaymentStateEnum.COMPLETED,
  idempotencyKey: 'idempotencyKey-4',
};

const paymentIntentObject = {
  impact: PaymentImpactEnum.OUT,
  amount: 100,
  currency: CurrencyCodeEnum.SAR,
  paymentMethod: PaymentMethodEnum.SADAD,
  account: 'account',
  state: IntentStateEnum.COMPLETED,
  idempotencyKey: 'idemp-key',
  billNumber: 'billnumber',
  ref3P: 'ref3P',
  payload: 'payload',
};

const validPendingEasypaisaIntent = {
  id: 'id',
  createdAt: 'createdAt',
  amount: 12000,
  currency: 'currency',
  paymentMethod: 'paymentMethod',
  account: 'account',
  state: 'state',
  idempotencyKey: 'idempotencyKey',
  billNumber: 'billNumber',
};

const billPaymentConfirmationBody = {
  username: 'TEST',
  password: '@bcd',
  billNumber: 'WT123',
  transactionAuthId: '112233',
  transactionAmount: '+000000012000',
  transactionDate: '20220831',
  transactionTime: '121359',
  bankMnemonic: 'KESC0001',
  reserved: '12312312',
};

describe('PaymentService-bulkWalletAdjustment', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return findByIdempKeyObject;
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(findByIdempKeyObject)
      .mockReturnValueOnce(undefined),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),

    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('bulkWalletAdjustment', () => {
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

    jest.spyOn(PaymentService.prototype, 'exportAndEmailBulkTopupCSV').mockImplementation().mockResolvedValue();

    it('should return empty object', async () => {
      const res = {};
      expect(await paymentService.bulkWalletAdjustment(headerDto, topupArray)).toEqual(res);
    });
  });
});

describe('PaymentService-getPaymentIntentDetails', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsByIdempKey: jest.fn(() => {
      return paymentIntentObject;
    }),
  };
  const mockApiWrapperService = {};
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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('getPaymentIntentDetails', () => {
    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.getPaymentIntentDetails('idemp-key')).toEqual(res);
    });
  });
});

describe('PaymentService-getPaymentIntentDetailsBySadadNumber', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsBySadadNumber: jest.fn(() => {
      return paymentIntentObject;
    }),
  };
  const mockApiWrapperService = {};
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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('getPaymentIntentDetailsBySadadNumber', () => {
    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.getPaymentIntentDetailsBySadadNumber('sadad-number')).toEqual(res);
    });
  });
});

describe('PaymentService-createTopupIntent-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findTopupIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, paymentMethod: PaymentMethodEnum.EASYPAISA };
    }),

    findTopupIntent: jest.fn(() => {
      return { ...paymentIntentObject, paymentMethod: PaymentMethodEnum.EASYPAISA };
    }),

    updateWalletTopupIntent: jest.fn(() => {
      return null;
    }),

    createWalletTopupIntent: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.PENDING, paymentMethod: PaymentMethodEnum.EASYPAISA };
    }),
  };
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
    }).compile();
    jest.spyOn(jwtUtil, 'decodeJwt').mockReturnValue({
      id: 105445,
    });
    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('createTopupIntent', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const topupIntentDto = new TopupIntentDto();
    topupIntentDto.total = new MoneyDto(300, CurrencyCodeEnum.PKR);
    topupIntentDto.paymentMethod = PaymentMethodEnum.EASYPAISA;

    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.createTopupIntent(headerDto, topupIntentDto)).toEqual(res);
    });
  });
});

describe('PaymentService-fetchTopupIntent-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getValidEasypaisaIntent: jest.fn(() => {
      return { ...paymentIntentObject, paymentMethod: PaymentMethodEnum.EASYPAISA };
    }),
  };
  const mockApiWrapperService = {};
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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('fetchTopupIntent', () => {
    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.fetchTopupIntent('retailer-id')).toEqual(res);
    });
  });
});

describe('PaymentService-fetchTopupIntent-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getValidEasypaisaIntent: jest.fn(() => {
      return [];
    }),
  };
  const mockApiWrapperService = {};
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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('fetchTopupIntent', () => {
    it('should return payment intent object', async () => {
      const res = {};
      expect(await paymentService.fetchTopupIntent('retailer-id')).toEqual(res);
    });
  });
});

describe('PaymentService-billConfirmationCall-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getEasypaisaPaymentDetails: jest.fn(() => {
      return undefined;
    }),
    getPendingEasypaisaIntentsByBillNumber: jest.fn(() => {
      return [validPendingEasypaisaIntent];
    }),
    findByIdempKey: jest.fn(() => {
      return undefined;
    }),
    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
    setIntentState: jest.fn(() => {
      return true;
    }),
    createEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
    updatePaymentStatusEntity: jest.fn(() => {
      return true;
    }),
  };

  const mockApiWrapperService = {
    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentConfirmationSuccessCall', () => {
    it('should return success response code which is 00', async () => {
      const response = {
        response_Code: '00',
        Identification_parameter: `consumer number ${billPaymentConfirmationBody.billNumber} paid`,
        reserved: 'payment successful',
      };
      expect(await paymentService.billPaymentConfirmation(billPaymentConfirmationBody)).toEqual(response);
    });
  });
});

describe('PaymentService-billConfirmationCall-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getEasypaisaPaymentDetails: jest.fn(() => {
      return undefined;
    }),
    getPendingEasypaisaIntentsByBillNumber: jest.fn(() => {
      return [];
    }),
    updatePaymentStatusEntity: jest.fn(() => {
      return true;
    }),
    findByIdempKey: jest.fn(() => {
      return undefined;
    }),
    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
    setIntentState: jest.fn(() => {
      return true;
    }),
    createEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
  };

  const mockApiWrapperService = {
    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentConfirmationIntentNotFound', () => {
    it('should throw error saying intent not found response code which is 01', async () => {
      await expect(async () => {
        await paymentService.billPaymentConfirmation(billPaymentConfirmationBody);
      }).rejects.toThrow(EasypaisaPaymentIntentNotFoundException);
    });
  });
});

describe('PaymentService-billConfirmationCall-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
    getPendingEasypaisaIntentsByBillNumber: jest.fn(() => {
      return [validPendingEasypaisaIntent];
    }),
    createEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
    updatePaymentStatusEntity: jest.fn(() => {
      return true;
    }),
    findByIdempKey: jest.fn(() => {
      return true;
    }),
    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
    setIntentState: jest.fn(() => {
      return true;
    }),
  };

  const mockApiWrapperService = {
    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentConfirmationDuplicateCall', () => {
    it('should return duplicate transaction response code which is 03', async () => {
      await expect(async () => {
        await paymentService.billPaymentConfirmation(billPaymentConfirmationBody);
      }).rejects.toThrow(EasypaisaPaymentDuplicateTransactionException);
    });
  });
});

describe('PaymentService-billConfirmationCall-4', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getEasypaisaPaymentDetails: jest.fn(() => {
      return undefined;
    }),
    getPendingEasypaisaIntentsByBillNumber: jest.fn(() => {
      return [validPendingEasypaisaIntent];
    }),
    findByIdempKey: jest.fn(() => {
      return undefined;
    }),
    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
    setIntentState: jest.fn(() => {
      return true;
    }),
    createEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
    updatePaymentStatusEntity: jest.fn(() => {
      return true;
    }),
  };

  const mockApiWrapperService = {
    rechargeWallet: jest.fn(() => {
      throw new Error();
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentConfirmationWalletRechargeFailure', () => {
    it('should error due to recharge failure with code 02', async () => {
      await expect(async () => {
        await paymentService.billPaymentConfirmation(billPaymentConfirmationBody);
      }).rejects.toThrow(EasypaisaPaymentBadTransactionException);
    });
  });
});

describe('PaymentService-billConfirmationCall-5', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getEasypaisaPaymentDetails: jest.fn(() => {
      return undefined;
    }),
    getPendingEasypaisaIntentsByBillNumber: jest.fn(() => {
      return [validPendingEasypaisaIntent, validPendingEasypaisaIntent];
    }),
    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),
    setIntentState: jest.fn(() => {
      return true;
    }),
    createEasypaisaPaymentDetails: jest.fn(() => {
      return true;
    }),
    updatePaymentStatusEntity: jest.fn(() => {
      return true;
    }),
    findByIdempKey: jest.fn(() => {
      return false;
    }),
  };

  const mockApiWrapperService = {
    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentConfirmationInternalFunctionalityFailure', () => {
    it('should throw error due to getting multiple intents', async () => {
      await expect(async () => {
        await paymentService.billPaymentConfirmation(billPaymentConfirmationBody);
      }).rejects.toThrow(EasypaisaPaymentBadTransactionException);
    });
  });
});

describe('PaymentService-billPaymentInquiry-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getRecentEasypaisaIntent: jest.fn(() => {
      return { state: IntentStateEnum.PENDING, createdAt: new Date(), amount: 1200 };
    }),
  };
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
  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentInquiry - intent does not exists', () => {
    const inquiryDto = new BillPaymentInquiryDto();
    inquiryDto.billNumber = 'WT105445';
    inquiryDto.bankMnemonic = 'bank_mnemonic';
    inquiryDto.password = 'password';
    inquiryDto.username = 'username';
    inquiryDto.reserved = 'reserved';

    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.billPaymentInquiry(inquiryDto)).toEqual(res);
    });
  });
});

describe('PaymentService-billPaymentInquiry-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getRecentEasypaisaIntent: jest.fn(() => {
      return { state: IntentStateEnum.COMPLETED, createdAt: new Date(), amount: 1200 };
    }),
    getEasypaisaTransactionData: jest.fn(() => {
      return { amount: 1200, transactionAuthId: 'transactionAuthId', transactionDate: 'transactionDate' };
    }),
  };
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
  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentInquiry-1', () => {
    const inquiryDto = new BillPaymentInquiryDto();
    inquiryDto.billNumber = 'WT105445';
    inquiryDto.bankMnemonic = 'bank_mnemonic';
    inquiryDto.password = 'password';
    inquiryDto.username = 'username';
    inquiryDto.reserved = 'reserved';

    it('should return payment intent object', async () => {
      const res = expect.any(Object);
      expect(await paymentService.billPaymentInquiry(inquiryDto)).toEqual(res);
    });
  });
});

describe('PaymentService-billPaymentInquiry-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getRecentEasypaisaIntent: jest.fn(() => {
      return { state: IntentStateEnum.COMPLETED, createdAt: new Date(), amount: 1200 };
    }),
    getTransactionAuthId: jest.fn(() => {
      return { amount: 1200, transactionAuthId: 'transactionAuthId', transactionDate: 'transactionDate' };
    }),
  };
  const mockApiWrapperService = {
    fetchUser: jest.fn(() => {
      throw new NotFoundException('not found');
    }),
  };
  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'token';
    }),
  };

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
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('billPaymentInquiry-user does not exists', () => {
    const inquiryDto = new BillPaymentInquiryDto();
    inquiryDto.billNumber = 'WT105445';
    inquiryDto.bankMnemonic = 'bank_mnemonic';
    inquiryDto.password = 'password';
    inquiryDto.username = 'username';
    inquiryDto.reserved = 'reserved';

    it('should throw an error because of non existent intent', async () => {
      await expect(async () => {
        await paymentService.billPaymentInquiry(inquiryDto);
      }).rejects.toThrow(EasypaisaInquiryIntentNotFoundException);
    });
  });
});
