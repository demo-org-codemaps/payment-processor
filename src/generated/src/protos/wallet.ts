/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import * as Long from 'long';
import * as _m0 from 'protobufjs/minimal';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export const protobufPackage = 'wallet';

export enum CountryEnum {
  PK = 0,
  SA = 1,
  UNRECOGNIZED = -1,
}

export enum TransactionTypeEnum {
  ORDER_PAYMENT = 0,
  ORDER_TOPUP = 1,
  TOPUP_TOPUP = 2,
  TOPUP_LOYALTY = 3,
  BATCH_TOPUP = 4,
  UNRECOGNIZED = -1,
}

export interface WalletInquiryMsg {
  retailerId: string;
  countryCode: CountryEnum;
}

export interface WalletBalanceMsg {
  walletInquiry: WalletInquiryMsg | undefined;
  amount: number;
}

export interface WalletMsg {
  subTransactionId: string;
  retailerId: string;
  countryCode: CountryEnum;
  amount: number;
  transactionType?: TransactionTypeEnum | undefined;
  comment?: string | undefined;
}

export interface WalletReturnMsg {
  id: string;
}

export const WALLET_PACKAGE_NAME = 'wallet';

export interface WalletServiceClient {
  checkBalance(request: WalletInquiryMsg, metadata?: Metadata): Observable<WalletBalanceMsg>;

  chargeWallet(request: WalletMsg, metadata?: Metadata): Observable<WalletReturnMsg>;

  rechargeWallet(request: WalletMsg, metadata?: Metadata): Observable<WalletReturnMsg>;
}

export interface WalletServiceController {
  checkBalance(
    request: WalletInquiryMsg,
    metadata?: Metadata
  ): Promise<WalletBalanceMsg> | Observable<WalletBalanceMsg> | WalletBalanceMsg;

  chargeWallet(
    request: WalletMsg,
    metadata?: Metadata
  ): Promise<WalletReturnMsg> | Observable<WalletReturnMsg> | WalletReturnMsg;

  rechargeWallet(
    request: WalletMsg,
    metadata?: Metadata
  ): Promise<WalletReturnMsg> | Observable<WalletReturnMsg> | WalletReturnMsg;
}

export function WalletServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['checkBalance', 'chargeWallet', 'rechargeWallet'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod('WalletService', method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod('WalletService', method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const WALLET_SERVICE_NAME = 'WalletService';

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
