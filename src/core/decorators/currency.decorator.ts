import { registerDecorator, ValidationOptions } from 'class-validator';

export function AllowedEasypaisaCurrencies(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'AllowedEasypaisaCurrencies',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value.currency === 'PKR';
        },
      },
    });
  };
}
