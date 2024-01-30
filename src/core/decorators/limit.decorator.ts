import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPkrLimit(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: `Top-up amount must be less than ${parseInt(process.env.WALLET_TOPUP_LIMIT_IN_PAISAS) / 100} PKR`,
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value.currency === 'PKR' && value.amount > process.env.WALLET_TOPUP_LIMIT_IN_PAISAS ? false : true;
        },
      },
    });
  };
}
