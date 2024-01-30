import { Injectable, OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AppUtil, CurrencyCodeEnum, genericRetryStrategy, HeadersDto } from '../../shared';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { MoneyDto, WalletDto } from '../dtos';
import { LogDecorator } from '../../core';
import { ILiability, IUser } from '../../shared/types';
import { AuthService } from '../../auth';
import { LmsDataDto } from '../dtos/lms-body.dto';
@Injectable()
export class ApiWrapperService implements OnModuleInit {
  private walletEndpoint: string;
  private bnplWalletEndpoint: string;
  private userEndpoint: string;
  private eefaEndpoint: string;
  private eefaEntityActivityId: string;
  private callerEndpoints: Record<string, string>;
  private eefaCreds: { username: string; password: string };

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  onModuleInit() {
    this.bnplWalletEndpoint = this.configService.get('bnplWalletEndpoint');
    this.walletEndpoint = this.configService.get('WALLET_ENDPOINT');
    this.userEndpoint = this.configService.get('USER_ENDPOINT');
    this.eefaEndpoint = this.configService.get('EEFA_ENDPOINT');
    this.eefaEntityActivityId = this.configService.get('EEFA_ENTITY_ACTIVITY_ID');
    this.eefaCreds = this.configService.get('eefaCreds');
    this.callerEndpoints = this.configService.get('callerEndpoints');
  }

  @LogDecorator()
  async fetchCoinBalance(headers: HeadersDto, retailerId: string, currency?: CurrencyCodeEnum): Promise<MoneyDto> {
    const res = this.httpService
      .get(`${this.walletEndpoint}/balance/${retailerId}?currency=${currency}`, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    const balance: AxiosResponse<any> = await lastValueFrom(res);
    return MoneyDto.fromJSON(balance.data.data);
  }

  @LogDecorator()
  async chargeWallet(headers: HeadersDto, data: WalletDto): Promise<boolean> {
    const { money } = data;
    const res = this.httpService
      .post(`${this.walletEndpoint}/charge`, { ...data, money: money.toJSON() }, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    await lastValueFrom(res);
    return true;
  }

  @LogDecorator()
  async rechargeWallet(headers: HeadersDto, data: WalletDto): Promise<boolean> {
    const { money } = data;
    const res = this.httpService
      .post(`${this.walletEndpoint}/recharge`, { ...data, money: money.toJSON() }, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    await lastValueFrom(res);
    return true;
  }

  @LogDecorator()
  async notifyPaymentOwner(idempotencyKey: string): Promise<boolean> {
    const token = await this.authService.generateServiceToken();
    const headers = new HeadersDto();
    headers.idempotencyKey = idempotencyKey;
    headers.authorization = token;
    const res = this.httpService
      .put(`${this.callerEndpoints['opeEndpoint']}`, {}, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    await lastValueFrom(res);
    return true;
  }

  @LogDecorator()
  async fetchUser(headers: HeadersDto, retailerId: string): Promise<IUser> {
    const res = this.httpService
      .get(`${this.userEndpoint}/${retailerId}`, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    const {
      data: { data },
    }: AxiosResponse<any> = await lastValueFrom(res);
    return data;
  }

  @LogDecorator()
  async fetchLiabilityByOrderId(headers: HeadersDto, orderId: string): Promise<ILiability> {
    const res = this.httpService
      .get(`${this.bnplWalletEndpoint}/loanTransaction/getRemainingLiabilityAmountByOrderId?orderId=${orderId}`, {
        headers: headers.toJSON(),
      })
      .pipe(genericRetryStrategy());
    const { data }: AxiosResponse<any> = await lastValueFrom(res);
    return data;
  }

  @LogDecorator()
  async settleLiabilityAgainstOrder(headers: HeadersDto, body: LmsDataDto[]): Promise<any> {
    const res = this.httpService
      .post(`${this.bnplWalletEndpoint}/loanTransaction/loanRepaymentThroughThirdParties`, body, {
        headers: headers.toJSON(),
      })
      .pipe(genericRetryStrategy());
    const { data }: AxiosResponse<any> = await lastValueFrom(res);
    return data;
  }

  @LogDecorator()
  async createSadadIntent(user: IUser, money: MoneyDto, billNumber: string): Promise<Record<string, string>> {
    const currDate = new Date();
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 2);
    const payload = {
      billNumber,
      entityActivityId: this.eefaEntityActivityId,
      customerFullName: user.name,
      customerIdNumber: user.id,
      customerEmailAddress: user.email,
      customerMobileNumber: user.phone,
      issueDate: AppUtil.isoToDateString(currDate),
      expireDate: AppUtil.isoToDateString(expDate),
      billItemList: [
        {
          name: 'demo Invoice',
          quantity: 1,
          unitPrice: money.getAmountInDouble(),
          discount: 0,
          discountType: 'FIXED',
          vat: '0',
        },
      ],
    };
    const resObs = this.httpService
      .post(`${this.eefaEndpoint}/simple/upload`, payload, { headers: this.eefaCreds })
      .pipe(genericRetryStrategy());
    const res: AxiosResponse<any> = await lastValueFrom(resObs);
    const { data } = res.data;
    return data;
  }

  @LogDecorator()
  async cancelSadadIntent(billNumber: string): Promise<boolean> {
    try {
      const resObs = this.httpService
        .put(`${this.eefaEndpoint}/cancel?billNumber=${billNumber}`, {}, { headers: this.eefaCreds })
        .pipe(genericRetryStrategy());
      const res: AxiosResponse<any> = await lastValueFrom(resObs);
      return !!res.data;
    } catch (e) {
      return false;
    }
  }

  @LogDecorator()
  async fetchSadadIntent(billNumber: string): Promise<Record<string, any>> {
    const resObs = this.httpService
      .get(`${this.eefaEndpoint}/bill/info?billNumber=${billNumber}`, { headers: this.eefaCreds })
      .pipe(genericRetryStrategy());
    const res: AxiosResponse<any> = await lastValueFrom(resObs);
    const { data } = res.data;
    return data;
  }
}
