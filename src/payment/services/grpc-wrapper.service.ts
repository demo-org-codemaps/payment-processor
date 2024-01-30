import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { genericRetryStrategy } from '../../shared';
import {
  CountryEnum,
  WalletBalanceMsg,
  WalletInquiryMsg,
  WalletMsg,
  WalletServiceClient,
  WALLET_PACKAGE_NAME,
  WALLET_SERVICE_NAME,
} from '../../generated/src/protos/wallet';

@Injectable()
export class GrpcWrapperService implements OnModuleInit {
  constructor(@Inject(WALLET_PACKAGE_NAME) private walletClient: ClientGrpc) {}
  private walletService: WalletServiceClient;

  onModuleInit() {
    this.walletService = this.walletClient.getService<WalletServiceClient>(WALLET_SERVICE_NAME);
  }

  async fetchCoinBalance(retailerId: string, countryCode?: CountryEnum): Promise<number> {
    const msg: WalletInquiryMsg = {
      retailerId,
      countryCode: countryCode ? countryCode : CountryEnum.PK,
    };
    const res = this.walletService.checkBalance(msg).pipe(genericRetryStrategy());
    const balance: WalletBalanceMsg = await lastValueFrom(res);
    return balance.amount;
  }

  async chargeWallet(walletMsg: WalletMsg): Promise<boolean> {
    const res = this.walletService.chargeWallet(walletMsg).pipe(genericRetryStrategy());
    await lastValueFrom(res);
    return true;
  }

  async rechargeWallet(walletMsg: WalletMsg): Promise<boolean> {
    const res = this.walletService.rechargeWallet(walletMsg).pipe(genericRetryStrategy());
    await lastValueFrom(res);
    return true;
  }

  //   async rechargeWallet(msg: HoldMsg): Promise<string[]> {
  //     const res = this.paymentService.topUpProcedure(msg).pipe(genericRetryStrategy());
  //     const rechargeIds: PaymentIdsMsg = await lastValueFrom(res);
  //     return rechargeIds.ids;
  //   }
}
