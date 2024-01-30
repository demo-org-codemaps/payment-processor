import { BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CsvHoldDto, TopupCsvArrayDto } from '../dtos';
import { PaymentMethodEnum, CSVFailedError, CSVFailedExceptions, TransactionTypeEnum } from '../../shared';

export const parseCsvFile = (file: { buffer }): string[] => {
  if (!file?.buffer) throw new BadRequestException('FILE_NOT_FOUND');
  const csvData = file.buffer
    .toString()
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '');
  return csvData;
};

export const createAndValidateCSVData = async (csvData: string[]): Promise<TopupCsvArrayDto> => {
  const topups: CsvHoldDto[] = [];
  const errorCollection: CSVFailedError[] = [];
  for (const [index, csvEntry] of csvData.entries()) {
    const [account, amount, currency, transactionType, comments] = csvEntry.split(',').slice(0, 5);
    const holdDto = {
      account,
      money: {
        amount,
        currency,
      },
      transactionType,
      comments,
      paymentMethod:
        transactionType === TransactionTypeEnum.REVERSAL ? PaymentMethodEnum.WALLET : PaymentMethodEnum.CASH,
    };
    const obj = plainToClass(CsvHoldDto, holdDto);
    const errors = await validate(obj);
    if (errors.length > 0) errorCollection.push(new CSVFailedError(index + 1, csvEntry, errors));
    topups.push(obj);
  }
  if (errorCollection.length > 0) throw new CSVFailedExceptions(errorCollection);
  return { topups };
};
