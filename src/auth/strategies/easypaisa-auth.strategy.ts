import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../services';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { CONSTANTS } from '../../app.constants';
import {
  EasypaisaInquiryInvalidDataException,
  EasypaisaPaymentInvalidDataException,
} from '../../shared/exceptions/easypaisa.exception';

@Injectable()
export class EasypaisaAuthStrategy extends PassportStrategy(Strategy, CONSTANTS.EASYPAISA_AUTH) {
  private readonly easypaisaUsername: string;
  private readonly easypaisaPassword: string;
  private readonly easypaisaBankMnemonic: string;

  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
    super();
    this.easypaisaUsername = this.configService.get('EASYPAISA_USERNAME');
    this.easypaisaPassword = this.configService.get('EASYPAISA_PASSWORD');
    this.easypaisaBankMnemonic = this.configService.get('EASYPAISA_BANK_MNEMONIC');
  }

  async validate(request: Request): Promise<any> {
    const { username, password, Bank_Mnemonic, bank_mnemonic } = request.body;
    const bankMnemonic = Bank_Mnemonic ? Bank_Mnemonic : bank_mnemonic;
    if (
      username === this.easypaisaUsername &&
      password === this.easypaisaPassword &&
      bankMnemonic === this.easypaisaBankMnemonic
    ) {
      return true;
    } else {
      const pathString = request.route.path.split('/');
      if (pathString[pathString.length - 1] === 'BillInquiry') {
        throw new EasypaisaInquiryInvalidDataException();
      } else {
        throw new EasypaisaPaymentInvalidDataException();
      }
    }
  }
}
