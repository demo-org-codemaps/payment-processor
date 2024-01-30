import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule, AuthService } from '../auth';
import { WALLET_PACKAGE_NAME } from 'src/generated/src/protos/wallet';
import { grpcConfig } from '../core';
import { PaymentController } from './controllers';
import {
  PaymentStatusRepository,
  PaymentIntentRepository,
  SadadIntentDetailsRepository,
  SadadPaymentDetailsRepository,
} from './repositories';
import { ApiWrapperService, DbWrapperService, GrpcWrapperService } from './services';
import { PaymentService } from './services/payment.service';
import { EasypaisaPaymentDetailsRepository } from './repositories/easypaisa-payment-details.repository';
import { EasypaisaIntentDetailsRepository } from './repositories/easypaisa-intent-details.repository';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentStatusRepository,
      PaymentIntentRepository,
      EasypaisaPaymentDetailsRepository,
      EasypaisaIntentDetailsRepository,
      SadadIntentDetailsRepository,
      SadadPaymentDetailsRepository,
    ]),
    HttpModule,
    AuthModule,
    TerminusModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    DbWrapperService,
    GrpcWrapperService,
    ApiWrapperService,
    AuthService,
    {
      provide: WALLET_PACKAGE_NAME,
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(grpcConfig(configService, WALLET_PACKAGE_NAME)),
      inject: [ConfigService],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
