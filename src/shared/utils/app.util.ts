import * as _ from 'lodash';
import { PaymentActionEnum, TransactionTypeEnum } from '../enums';

export class AppUtil {
  public static isNumber(field): boolean {
    if (field === null || field === undefined || field.toString() === 'NaN') {
      return false;
    }

    return _.isNumber(field);
  }

  public static delay = n => new Promise(r => setTimeout(r, n * 1000));

  public static enumKeys(e: Record<string, unknown>): string[] {
    return Object.keys(e).filter(x => !(parseInt(x) >= 0));
  }

  public static generateIdempKey(id: string, impact: string): string {
    return `${id}_${impact}`;
  }

  public static isoToDateString = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  public static getActionByType = (transactionTypeEnum: TransactionTypeEnum): PaymentActionEnum => {
    switch (transactionTypeEnum) {
      case TransactionTypeEnum.REVERSAL:
      case TransactionTypeEnum.ORDER_PAYMENT:
        return PaymentActionEnum.CHARGE;
      default:
        return PaymentActionEnum.RELEASE;
    }
  };
}
