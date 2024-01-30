import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthDto } from '../dtos';
import { createServiceToken, verifyServiceToken, verifyUserToken } from '@demoorg/auth-library/dist';
import { IVerifyTokenResponse } from '@demoorg/auth-library/dist/interfaces';
import { LogDecorator } from '../../core';

@Injectable()
export class AuthService {
  @LogDecorator({ skipLogDetails: true })
  async verifyAuthToken(dto: AuthDto) {
    try {
      const verifyUserTokenResponse: IVerifyTokenResponse = await verifyUserToken(dto.authToken);
      return verifyUserTokenResponse;
    } catch (error) {
      return false; // Don't fail it
    }
  }

  @LogDecorator({ skipLogDetails: true })
  async verifyToken(dto: AuthDto) {
    try {
      const verifyTokenResponse: IVerifyTokenResponse = await verifyServiceToken(dto.authToken);
      return verifyTokenResponse;
    } catch (error) {
      return false; // Don't fail it
    }
  }

  @LogDecorator({ skipLogDetails: true })
  async generateServiceToken(token?: string): Promise<string> {
    try {
      const serviceToken = await createServiceToken(token);
      if (!serviceToken) throw new InternalServerErrorException('AUTH_TOKEN_NOT_GENERATED');
      return serviceToken;
    } catch (error) {
      throw error;
    }
  }
}
