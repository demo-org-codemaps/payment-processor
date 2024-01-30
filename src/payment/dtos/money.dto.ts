import { IsNotEmpty, IsEnum, Min } from 'class-validator';
import { classToPlain, Expose, plainToClass, Transform } from 'class-transformer';
import { CurrencyCodeEnum } from '../../shared/';
import { CONSTANTS } from '../../app.constants';

export class MoneyDto {
  @Expose({ toClassOnly: true })
  @IsNotEmpty()
  @Min(0)
  @Transform(
    ({ value, obj }) => {
      // will convert amount to Paisas or lowest denomincation
      const currencyDefaults = CONSTANTS.CURRENCIES[obj.currency] || CONSTANTS.CURRENCIES['PKR'];
      const number = Number(
        Number(parseFloat(value) * currencyDefaults.LOWEST_DENOMINATION).toFixed(currencyDefaults.PRECISION)
      );
      return number;
    },
    { toClassOnly: true }
  )
  amount: number;

  @Expose({ toPlainOnly: true, name: 'convertedAmount' })
  getAmountInDouble() {
    // will convert amount to PKR or main currency
    const currencyDefaults = CONSTANTS.CURRENCIES[this.currency] || CONSTANTS.CURRENCIES['PKR'];
    let amt = this.amount;
    if (this.isNegative()) amt = 0;
    return Number((amt / currencyDefaults.LOWEST_DENOMINATION).toFixed(currencyDefaults.PRECISION));
  }

  @Expose()
  @IsNotEmpty()
  @IsEnum(CurrencyCodeEnum)
  currency: CurrencyCodeEnum;

  static fromJSON(money: Pick<MoneyDto, 'amount' | 'currency'>): MoneyDto {
    return plainToClass(MoneyDto, money); // will run Transform
  }

  static zeroMoney(currency: CurrencyCodeEnum): MoneyDto {
    return plainToClass(MoneyDto, { amount: 0, currency }); // will run Transform
  }

  constructor(amount: number, currency: CurrencyCodeEnum) {
    this.currency = currency;
    this.amount = amount;
    if (!amount) this.amount = 0;
    if (!Number.isInteger(amount)) this.amount = Math.floor(amount);
  }

  add(addend: MoneyDto): MoneyDto {
    const amt = this.amount + addend.amount;
    return new MoneyDto(amt, this.currency);
  }

  subtract(subtrahend: MoneyDto): MoneyDto {
    const amt = this.amount - subtrahend.amount;
    return new MoneyDto(amt, this.currency);
  }

  abs(): MoneyDto {
    const amt = Math.abs(this.amount);
    return new MoneyDto(amt, this.currency);
  }

  greaterThan(money: MoneyDto) {
    return this.amount > money.amount;
  }

  lessThan(money: MoneyDto) {
    return this.amount < money.amount;
  }

  greaterThanOrEqual(money: MoneyDto) {
    return this.amount >= money.amount;
  }

  lessThanOrEqual(money: MoneyDto) {
    return this.amount <= money.amount;
  }

  isZero() {
    return this.amount == 0;
  }

  isPositive() {
    return this.amount > 0;
  }

  isZeroOrPositive() {
    return this.amount >= 0;
  }

  isNegative() {
    return this.amount < 0;
  }

  isZeroOrNegative() {
    return this.amount <= 0;
  }

  toJSON() {
    const jsonAmt = classToPlain(this); // will run Transform
    return { amount: jsonAmt.convertedAmount, currency: jsonAmt.currency };
  }
}
