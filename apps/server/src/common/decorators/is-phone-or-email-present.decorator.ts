import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Вешается на phone: без связки «хотя бы один контакт» @IsOptional на обоих полях пропустил бы пустую форму.
export function IsPhoneOrEmailPresent(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isPhoneOrEmailPresent',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const { phone, email } = args.object as {
            phone?: string;
            email?: string;
          };
          return Boolean(phone?.trim() || email?.trim());
        },
      },
    });
  };
}
