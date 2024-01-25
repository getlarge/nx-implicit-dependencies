import { Reception } from '@getlarge/ts-interfaces';
import { BadRequestException, Logger, PipeTransform } from '@nestjs/common';
import typia from 'typia';

export class IsValidReceptionPipe implements PipeTransform<unknown, Reception> {
  readonly logger = new Logger(IsValidReceptionPipe.name);

  transform(value: unknown) {
    const res = typia.is<Reception>(value);
    if (!res) {
      const { errors }: typia.IValidation<Reception> =
        typia.validate<Reception>(value);
      this.logger.error(errors);
      throw new BadRequestException('Validation failed');
    }

    return value;
  }
}
