import { Routes } from '@nestjs/core';
import { PaymentModule } from './payment/payment.module';

export const appRoutes: Routes = [
  {
    path: 'payment',
    module: PaymentModule,
  },
];
