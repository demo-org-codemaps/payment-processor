import { BadRequestException, Logger, PreconditionFailedException } from '@nestjs/common';
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
import { HoldDto, MoneyDto, OutDto, PaymentNotificationDto } from '../dtos';
import { PaymentStatusEntity } from '../entities';
import { ApiWrapperService } from './api-wrapper.service';
import { DbWrapperService } from './db-wrapper.service';
import { AuthService } from '../../auth';
import { PaymentService } from './payment.service';
import { RollbackDto } from '../dtos/rollback.dto';
import { ConfigService } from '@nestjs/config';

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

const findByIdempKeyOutObject = {
  action: PaymentActionEnum.HOLD,
  impact: PaymentImpactEnum.IN,
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  account: 'account',
  state: PaymentStateEnum.COMPLETED,
  idempotencyKey: 'idempotencyKey-1',
};

const setPaymentsStateObject = {
  action: PaymentActionEnum.HOLD,
  impact: PaymentImpactEnum.IN,
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  account: 'account',
  state: PaymentStateEnum.PENDING,
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

describe('PaymentService-Hold-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdProcedure-paymentMethod-cash', () => {
    const holdCashOutput = {
      action: PaymentActionEnum.HOLD,
      impact: PaymentImpactEnum.IN,
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.CASH,
      account: 'account',
      state: PaymentStateEnum.PENDING,
      idempotencyKey: 'siddiq1',
    } as PaymentStatusEntity;

    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    jest.spyOn(PaymentService.prototype, 'holdCash').mockImplementation().mockResolvedValue(holdCashOutput);

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdProcedure(headerDto, holdDto)).toEqual(res);
    });
  });

  describe('holdProcedure-paymentMethod-WALLET-PaymentStateEnum(Completed)', () => {
    const holdCashInput = {
      action: PaymentActionEnum.HOLD,
      impact: PaymentImpactEnum.IN,
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.CASH,
      account: 'account',
      state: PaymentStateEnum.PENDING,
      idempotencyKey: 'siddiq1',
    } as PaymentStatusEntity;

    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    jest.spyOn(PaymentService.prototype, 'holdCash').mockImplementation().mockResolvedValue(holdCashInput);

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdProcedure(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-Hold-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
    }),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdProcedure-paymentMethod-WALLET-PaymentStateEnum(PENDING)', () => {
    const holdCashInput = {
      action: PaymentActionEnum.HOLD,
      impact: PaymentImpactEnum.IN,
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.CASH,
      account: 'account',
      state: PaymentStateEnum.PENDING,
      idempotencyKey: 'siddiq1',
    } as PaymentStatusEntity;

    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    jest.spyOn(PaymentService.prototype, 'holdCash').mockImplementation().mockResolvedValue(holdCashInput);

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdProcedure(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-Hold-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: undefined };
    }),

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

    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(100, CurrencyCodeEnum.PKR);
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdProcedure-paymentMethod-WALLET-PaymentStateEnum(UNDEFINED)-less-money', () => {
    const holdCashInput = {
      action: PaymentActionEnum.HOLD,
      impact: PaymentImpactEnum.IN,
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.CASH,
      account: 'account',
      state: PaymentStateEnum.PENDING,
      idempotencyKey: 'siddiq1',
    } as PaymentStatusEntity;

    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    jest.spyOn(PaymentService.prototype, 'holdCash').mockImplementation().mockResolvedValue(holdCashInput);

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdProcedure(headerDto, holdDto)).toEqual(res);
    });
  });

  describe('holdProcedure-paymentMethod-WALLET-PaymentStateEnum(UNDEFINED)-more-money', () => {
    const holdCashInput = {
      action: PaymentActionEnum.HOLD,
      impact: PaymentImpactEnum.IN,
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.CASH,
      account: 'account',
      state: PaymentStateEnum.PENDING,
      idempotencyKey: 'siddiq1',
    } as PaymentStatusEntity;

    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(200, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    jest.spyOn(PaymentService.prototype, 'holdCash').mockImplementation().mockResolvedValue(holdCashInput);

    it('should return error', async () => {
      try {
        await paymentService.holdProcedure(headerDto, holdDto);
      } catch (e) {
        expect(e).toBeInstanceOf(PreconditionFailedException);
        expect(e.message).toBe('INSUFFICIENT_BALANCE');
      }
    });
  });
});

describe('PaymentService-OutProcedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
    }),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('OutProcedure-PaymentStateEnum-pending', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'out-dto-comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return error', async () => {
      try {
        await paymentService.outProcedure(headerDto, outDto, PaymentActionEnum.RELEASE);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe('HOLD was not successful. HOLD it first.');
      }
    });
  });
});

describe('PaymentService-OutProcedure-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: PaymentStateEnum.COMPLETED };
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('OutProcedure-PaymentStateEnum-completed', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'out-dto-comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.outProcedure(headerDto, outDto, PaymentActionEnum.RELEASE)).toEqual(res);
    });
  });
});

describe('PaymentService-OutProcedure-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: PaymentStateEnum.COMPLETED };
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),

    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('OutProcedure-PaymentStateEnum2-pending', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'out-dto-comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.outProcedure(headerDto, outDto, PaymentActionEnum.RELEASE)).toEqual(res);
    });
  });
});

describe('PaymentService-OutProcedure-4', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: PaymentStateEnum.COMPLETED };
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

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

    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('OutProcedure-PaymentStateEnum2-undefined', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'out-dto-comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.outProcedure(headerDto, outDto, PaymentActionEnum.RELEASE)).toEqual(res);
    });
  });
});

describe('PaymentService-ReleaseProcedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return findByIdempKeyObject;
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('releaseProcedure', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'hold-comment';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.releaseProcedure(headerDto, outDto)).toEqual(res);
    });
  });
});

describe('PaymentService-ChargeProcedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return findByIdempKeyObject;
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),
  };
  const mockApiWrapperService = {
    chargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('chargeProcedure', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'hold-comment';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.chargeProcedure(headerDto, outDto)).toEqual(res);
    });
  });
});

describe('PaymentService-HoldCash-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return findByIdempKeyObject;
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdCash', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdCash(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-HoldCash-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdCash-PaymentStateEnum-Pending', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdCash(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-HoldCash-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: undefined };
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('holdCash-PaymentStateEnum-undefined', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.holdCash(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-topUpProcedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: undefined };
    }),

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

    rechargeWallet: jest.fn(() => {
      return true;
    }),

    verifyUser: jest.fn(() => {
      return true;
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('topUpProcedure-PaymentMethodEnum-wallet-PaymentStateEnum-undefined', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.WALLET;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      try {
        await paymentService.topUpProcedure(headerDto, holdDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe('Incorrect Payment Method');
      }
    });
  });

  describe('topUpProcedure-PaymentMethodEnum-cash--PaymentStateEnum-undefined', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.topUpProcedure(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-topUpProcedure-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
    }),

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

    rechargeWallet: jest.fn(() => {
      return true;
    }),

    verifyUser: jest.fn(() => {
      return true;
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('topUpProcedure-PaymentStateEnum-pending', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.topUpProcedure(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-topUpProcedure-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.COMPLETED };
    }),

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

    rechargeWallet: jest.fn(() => {
      return true;
    }),

    verifyUser: jest.fn(() => {
      return true;
    }),

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('topUpProcedure-PaymentStateEnum-completed', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.topUpProcedure(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-OutProcedure-5', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: undefined };
      })
      .mockReturnValueOnce(findByIdempKeyOutObject)
      .mockReturnValueOnce(null),

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

    rechargeWallet: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('OutProcedure-PaymentStateEnum-undefined', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const outDto = new OutDto();
    outDto.comments = 'out-dto-comments';
    outDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    it('should return payment status entity', async () => {
      const res = {
        account: expect.any(String),
        action: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        idempotencyKey: expect.any(String),
        impact: expect.any(String),
        paymentMethod: expect.any(String),
        state: expect.any(String),
      };
      expect(await paymentService.outProcedure(headerDto, outDto, PaymentActionEnum.RELEASE)).toEqual(res);
    });
  });
});

describe('PaymentService-sadadnotification-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsBySadadNumber: jest.fn(() => {
      return { ...paymentIntentObject };
    }),
  };
  const mockApiWrapperService = {
    notifyPaymentOwner: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('Completed-sadad-notification', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const paymentNotify = {
      districtCode: 'code',
      sadadPaymentId: 'payment-id',
      sadadNumber: 'number',
      paymentAmount: 100,
      branchCode: 'bcode',
      bankId: 'bid',
      accessChannel: 'achanel',
      paymentMethod: 'paymentmethod',
      billNumber: 'bnumber',
      bankPaymentId: 'bpid',
      paymentDate: 'date',
      paymentStatus: 'APPROVED',
    } as PaymentNotificationDto;

    it('should return payment status entity', async () => {
      const res = {
        status: 200,
        message: 'Operation Done Successfully',
      };

      expect(await paymentService.sadadNotification(paymentNotify)).toEqual(res);
    });
  });
});

describe('PaymentService-sadadnotification-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsBySadadNumber: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.CANCELLED };
    }),
  };
  const mockApiWrapperService = {
    notifyPaymentOwner: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('CANCELLED-sadad-notification', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const paymentNotify = {
      districtCode: 'code',
      sadadPaymentId: 'payment-id',
      sadadNumber: 'number',
      paymentAmount: 100,
      branchCode: 'bcode',
      bankId: 'bid',
      accessChannel: 'achanel',
      paymentMethod: 'paymentmethod',
      billNumber: 'bnumber',
      bankPaymentId: 'bpid',
      paymentDate: 'date',
      paymentStatus: 'APPROVED',
    } as PaymentNotificationDto;

    it('should return payment status entity', async () => {
      try {
        await paymentService.sadadNotification(paymentNotify);
      } catch (e) {
        expect(e.message).toEqual('Not Found');
        expect(e.status).toEqual(404);
      }
    });
  });
});

describe('PaymentService-sadadnotification-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsBySadadNumber: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.PENDING };
    }),

    completePaymentIntent: jest.fn(() => {
      return { ...findByIdempKeyObject };
    }),
  };
  const mockApiWrapperService = {
    notifyPaymentOwner: jest.fn(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-sadad-notification', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const paymentNotify = {
      districtCode: 'code',
      sadadPaymentId: 'payment-id',
      sadadNumber: 'number',
      paymentAmount: 100,
      branchCode: 'bcode',
      bankId: 'bid',
      accessChannel: 'achanel',
      paymentMethod: 'paymentmethod',
      billNumber: 'bnumber',
      bankPaymentId: 'bpid',
      paymentDate: 'date',
      paymentStatus: 'APPROVED',
    } as PaymentNotificationDto;

    const res = {
      status: 200,
      message: 'Operation Done Successfully',
    };

    it('should return payment status entity', async () => {
      expect(await paymentService.sadadNotification(paymentNotify)).toEqual(res);
    });
  });
});

describe('PaymentService-sadad-intent-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject };
    }),

    createIntentDetails: jest.fn(() => {
      return null;
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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-sadad-notification', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    const res = expect.any(Object);

    it('should return payment status entity', async () => {
      expect(await paymentService.intentSadad(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-sadad-intent-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    getPaymentIntentDetailsByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: undefined };
    }),

    createIntentDetails: jest.fn(() => {
      return null;
    }),

    createIntent: jest.fn(() => {
      return { ...paymentIntentObject };
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

    createSadadIntent: jest.fn(() => {
      return {
        sadadNumber: 'number',
        ref3P: 'ref3P',
      };
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-sadad-notification', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const holdDto = new HoldDto();
    holdDto.account = '10001';
    holdDto.comments = 'hold-comment';
    holdDto.money = new MoneyDto(45, CurrencyCodeEnum.PKR);
    holdDto.paymentMethod = PaymentMethodEnum.CASH;
    holdDto.transactionType = TransactionTypeEnum.ORDER_PAYMENT;

    const res = expect.any(Object);

    it('should return payment status entity', async () => {
      expect(await paymentService.intentSadad(headerDto, holdDto)).toEqual(res);
    });
  });
});

describe('PaymentService-Rollbackprocedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
    }),

    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: undefined };
    }),

    createIntent: jest.fn(() => {
      return { ...paymentIntentObject };
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

    createSadadIntent: jest.fn(() => {
      return {
        sadadNumber: 'number',
        ref3P: 'ref3P',
      };
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-rollback-procedure', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const rollbackDto = new RollbackDto();
    rollbackDto.transactionType = TransactionTypeEnum.ORDER_REFUND;
    rollbackDto.comments = 'hold-comment';
    rollbackDto.adjustedMoney = new MoneyDto(100, CurrencyCodeEnum.PKR);

    it('should return payment status entity', async () => {
      try {
        await paymentService.rollbackProcedure(headerDto, rollbackDto);
      } catch (e) {
        expect(e).toBeInstanceOf(PreconditionFailedException);
        expect(e.message).toEqual('CHARGE was not successful. CHARGE it first.');
      }
    });
  });
});

describe('PaymentService-Rollbackprocedure-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: PaymentStateEnum.PENDING };
      })
      .mockReturnValueOnce({ ...findByIdempKeyObject, state: undefined }),

    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: undefined };
    }),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),

    createIntent: jest.fn(() => {
      return { ...paymentIntentObject };
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

    rechargeWallet: jest.fn(() => {
      return true;
    }),

    createSadadIntent: jest.fn(() => {
      return {
        sadadNumber: 'number',
        ref3P: 'ref3P',
      };
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-rollback-procedure', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const rollbackDto = new RollbackDto();
    rollbackDto.transactionType = TransactionTypeEnum.ORDER_REFUND;
    rollbackDto.comments = 'hold-comment';
    rollbackDto.adjustedMoney = new MoneyDto(100, CurrencyCodeEnum.PKR);

    const res = {
      isReleased: expect.any(Boolean),
      rollbackTransaction: expect.any(Object),
    };

    it('should return payment status entity', async () => {
      expect(await paymentService.rollbackProcedure(headerDto, rollbackDto)).toEqual(res);
    });
  });
});

describe('PaymentService-Rollbackprocedure-3', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: undefined };
      })
      .mockReturnValueOnce({ ...findByIdempKeyObject, state: PaymentStateEnum.COMPLETED }),

    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: undefined };
    }),

    createPayment: jest.fn(() => {
      return createPaymentObject;
    }),

    setPaymentState: jest.fn(() => {
      return setPaymentsStateObject;
    }),

    createIntent: jest.fn(() => {
      return { ...paymentIntentObject };
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

    rechargeWallet: jest.fn(() => {
      return true;
    }),

    createSadadIntent: jest.fn(() => {
      return {
        sadadNumber: 'number',
        ref3P: 'ref3P',
      };
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        Logger,
        AuthService,
        ConfigService,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('PENDING-rollback-procedure', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const rollbackDto = new RollbackDto();
    rollbackDto.transactionType = TransactionTypeEnum.ORDER_REFUND;
    rollbackDto.comments = 'hold-comment';
    rollbackDto.adjustedMoney = new MoneyDto(100, CurrencyCodeEnum.PKR);

    const res = {
      isReleased: expect.any(Boolean),
      rollbackTransaction: expect.any(Object),
    };

    it('should return payment status entity', async () => {
      expect(await paymentService.rollbackProcedure(headerDto, rollbackDto)).toEqual(res);
    });
  });
});

describe('PaymentService-cancel3PIntent-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.PENDING };
    }),

    cancelPaymentIntent: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.CANCELLED };
    }),
  };
  const mockApiWrapperService = {
    cancelSadadIntent: jest.fn(() => {
      return null;
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

  describe('cancel3PIntent-PENDING', () => {
    it('should return empty array', async () => {
      const res = expect.any(Object);
      expect(await paymentService.cancel3PIntent('idemp-key')).toEqual(res);
    });
  });
});

describe('PaymentService-cancel3PIntent-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.COMPLETED };
    }),
  };
  const mockApiWrapperService = {};
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

  describe('cancel3PIntent-PENDING', () => {
    it('should return empty array', async () => {
      try {
        await paymentService.cancel3PIntent('idemp-key');
      } catch (e) {
        expect(e).toBeInstanceOf(PreconditionFailedException);
        expect(e.message).toBe('PAYMENT_IN_HOLD');
      }
    });
  });
});

describe('PaymentService-cancelProcedure-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject };
      })
      .mockReturnValueOnce(findByIdempKeyObject)
      .mockReturnValueOnce(findByIdempKeyObject)
      .mockReturnValueOnce(null),

    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.PENDING };
    }),

    cancelPaymentIntent: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.CANCELLED };
    }),
  };
  const mockApiWrapperService = {
    cancelSadadIntent: jest.fn(() => {
      return null;
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

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('cancelProcedure-1', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const body = {
      transactionType: TransactionTypeEnum.ORDER_REFUND,
      comments: 'testing',
    } as OutDto;

    const releaseProcedureOut = { ...findByIdempKeyObject } as PaymentStatusEntity;
    jest
      .spyOn(PaymentService.prototype, 'releaseProcedure')
      .mockImplementation()
      .mockResolvedValue(releaseProcedureOut);

    it('should return empty array', async () => {
      const res = expect.any(Object);
      expect(await paymentService.cancelProcedure(headerDto, body)).toEqual(res);
    });
  });
});

describe('PaymentService-cancelProcedure-2', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return null;
    }),

    findIntentByIdempKey: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.PENDING };
    }),

    cancelPaymentIntent: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.CANCELLED };
    }),
  };
  const mockApiWrapperService = {
    cancelSadadIntent: jest.fn(() => {
      return null;
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

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('cancelProcedure-1', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    const body = {
      transactionType: TransactionTypeEnum.ORDER_REFUND,
      comments: 'testing',
    } as OutDto;

    const releaseProcedureOut = { ...findByIdempKeyObject } as PaymentStatusEntity;
    jest
      .spyOn(PaymentService.prototype, 'releaseProcedure')
      .mockImplementation()
      .mockResolvedValue(releaseProcedureOut);

    it('should return empty array', async () => {
      const res = expect.any(Object);
      expect(await paymentService.cancelProcedure(headerDto, body)).toEqual(res);
    });
  });
});

describe('PaymentService-fetchIntentStatus-1', () => {
  let paymentService: PaymentService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return null;
    }),

    completePaymentIntent: jest.fn(() => {
      return { ...findByIdempKeyObject };
    }),

    getPaymentIntentDetailsByIdempKey: jest
      .fn(() => {
        return { ...paymentIntentObject, state: IntentStateEnum.COMPLETED };
      })
      .mockReturnValueOnce({ ...paymentIntentObject, state: IntentStateEnum.PENDING }),

    cancelPaymentIntent: jest.fn(() => {
      return { ...paymentIntentObject, state: IntentStateEnum.CANCELLED };
    }),
  };
  const mockApiWrapperService = {
    cancelSadadIntent: jest.fn(() => {
      return null;
    }),

    fetchSadadIntent: jest.fn(() => {
      return {
        statusCode: 'PAID_BY_SADAD',
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

    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  describe('fetchIntentStatus-1', () => {
    const headerDto = new HeadersDto();
    headerDto.authorization = 'authorization-string';
    headerDto.idempotencyKey = 'idempotency-key';
    headerDto.language = 'english';

    it('should return empty array', async () => {
      const res = expect.any(Object);
      expect(await paymentService.fetchIntentStatus(headerDto)).toEqual(res);
    });
  });
});
