import { Body, Controller, Get, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public, RequestHeaders } from '../../core';
import { PaymentService } from '../services/payment.service';
import { HoldDto, OutDto, PaymentNotificationDto } from '../dtos';
import { CONSTANTS } from '../../app.constants';
import { AuthGuard } from '@nestjs/passport';
import { BaseHeadersDto, HeadersDto } from '../../shared';
import { FileInterceptor } from '@nestjs/platform-express';
import { createAndValidateCSVData, parseCsvFile } from '../utils';
import { RollbackDto } from '../dtos/rollback.dto';
import { BillPaymentConfirmationDto } from '../dtos/bill-payment-confirmation.dto';
import { TopupIntentDto } from '../dtos/topup-intent.dto';
import { BillPaymentInquiryDto } from '../dtos/bill-payment-inquiry.dto';
import { TopupHoldDto } from '../dtos/topup-hold.dto';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@ApiTags('Payment')
@Public()
@Controller()
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService, private readonly health: HealthCheckService) {}

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Post('hold')
  async hold(@RequestHeaders() headers: HeadersDto, @Body() body: HoldDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.holdProcedure(headers, body);
    return { data: transaction.toJSON() };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Post('release')
  async release(@RequestHeaders() headers: HeadersDto, @Body() body: OutDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.releaseProcedure(headers, body);
    return { data: transaction.toJSON() };
  }

  @UseGuards(AuthGuard([CONSTANTS.SERVICE_AUTH, CONSTANTS.CONSUMER_AUTH]))
  @Post('cancel')
  async cancel(@RequestHeaders() headers: HeadersDto, @Body() body: OutDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.cancelProcedure(headers, body);
    return { data: transaction.toJSON() };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Post('charge')
  async charge(@RequestHeaders() headers: HeadersDto, @Body() body: OutDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.chargeProcedure(headers, body);
    return { data: transaction.toJSON() };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Post('rollback')
  async rollback(@RequestHeaders() headers: HeadersDto, @Body() body: RollbackDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.rollbackProcedure(headers, body);
    return {
      data: {
        isReleased: transaction?.isReleased,
        transaction: transaction?.rollbackTransaction?.toJSON(),
      },
    };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Post('topup')
  async topUp(@RequestHeaders() headers: HeadersDto, @Body() body: TopupHoldDto): Promise<Record<string, any>> {
    const transaction = await this.paymentService.topUpProcedure(headers, body);
    return { data: transaction.toJSON() };
  }

  @UseGuards(AuthGuard([CONSTANTS.CONSUMER_AUTH, CONSTANTS.SERVICE_AUTH]))
  @Get('status')
  async status(@RequestHeaders() headers: HeadersDto): Promise<Record<string, any>> {
    const status = await this.paymentService.fetchIntentStatus(headers);
    return { data: status.toJSON() };
  }

  @UseGuards(AuthGuard(CONSTANTS.CONSUMER_AUTH))
  @Post('/bulkTopupFile')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkTopupFile(
    @RequestHeaders() headers: BaseHeadersDto,
    @UploadedFile() file: { buffer: Buffer }
  ): Promise<any> {
    const csvData = parseCsvFile(file);

    // static validation - throws error if fails
    const topups = await createAndValidateCSVData(csvData);

    // dynamic validation - throws error if fails
    const errors = await this.paymentService.performDynamicValidation(headers, topups);

    if (errors?.length > 0) {
      return { errors: [{ data: errors }], name: errors.length > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS' }; // To match error response
    }

    // performing bulk topup asynchronously
    this.paymentService.bulkWalletAdjustment(headers, topups);

    return true;
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard(CONSTANTS.SIGNATURE_AUTH))
  @Post('/sadadNotification')
  async sadadNotification(@Body() body: PaymentNotificationDto) {
    // Never change the function name. Should always be 'sadadNotification' as it's being used in response interceptor
    const response = await this.paymentService.sadadNotification(body);
    return response;
  }

  @UseGuards(AuthGuard(CONSTANTS.CONSUMER_AUTH))
  @Post('create-intent')
  async createTopupIntent(
    @RequestHeaders() headers: HeadersDto,
    @Body() body: TopupIntentDto
  ): Promise<Record<string, any>> {
    const res = await this.paymentService.createTopupIntent(headers, body);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.CONSUMER_AUTH))
  @Get('fetch-intent')
  async fetchTopupIntent(@Query('retailerId') retailerId: string): Promise<Record<string, any>> {
    const res = await this.paymentService.fetchTopupIntent(retailerId);
    return { data: res };
  }

  //if updating function name, update in response interceptor too
  @UseGuards(AuthGuard(CONSTANTS.EASYPAISA_AUTH))
  @Post('easypaisa/BillPayment')
  async billPaymentConfirmation(@Body() body: BillPaymentConfirmationDto) {
    return await this.paymentService.billPaymentConfirmation(body);
  }

  //if updating function name, update in response interceptor too
  @UseGuards(AuthGuard(CONSTANTS.EASYPAISA_AUTH))
  @Post('easypaisa/BillInquiry')
  async billPaymentInquiry(@Body() body: BillPaymentInquiryDto) {
    return await this.paymentService.billPaymentInquiry(body);
  }

  @Post('easypaisa')
  @HealthCheck()
  async easypaisaHealthCheck() {
    return this.health.check([]);
  }
}
