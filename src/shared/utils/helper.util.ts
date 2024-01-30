import { BadRequestException } from '@nestjs/common';
import { TransactionTypeEnum } from '../enums';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

export const formatAmount = ({ amount }) => {
  return parseFloat(amount)
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const getTemplateName = (transactionType: TransactionTypeEnum): NotificationTypeEnum => {
  switch (transactionType) {
    //charging user wallet
    case TransactionTypeEnum.ORDER_PAYMENT:
    case TransactionTypeEnum.EASY_LOAD_TRANSACTION:
    case TransactionTypeEnum.MOBILE_LOAD_PAYMENT:
      return NotificationTypeEnum.SUCCESS_WALLET_CHARGE;

    //recharging user wallet
    case TransactionTypeEnum.PROMOTIONAL_TOPUP:
    case TransactionTypeEnum.SELF_TOPUP:
    case TransactionTypeEnum.REWARDS:
    case TransactionTypeEnum.EASY_LOAD_EARNING:
    case TransactionTypeEnum.GOODS_RETURN:
    case TransactionTypeEnum.MOBILE_LOAD_BONUS:
    case TransactionTypeEnum.MOBILE_LOAD_COMMISSION:
    case TransactionTypeEnum.WALLET_CASHBACK:
      return NotificationTypeEnum.WALLET_TOP_UP;

    //recharge by refund
    case TransactionTypeEnum.ORDER_REFUND:
      return NotificationTypeEnum.WALLET_REFUND;

    //carge wallet by reverse top up
    case TransactionTypeEnum.REVERSAL:
      return NotificationTypeEnum.WALLET_REVERSAL;

    default:
      throw new BadRequestException('Transaction type not supported');
  }
};
