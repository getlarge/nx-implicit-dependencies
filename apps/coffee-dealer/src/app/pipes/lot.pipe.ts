import { Lot } from '@getlarge/ts-interfaces';
import { PipeTransform, BadRequestException, Logger } from '@nestjs/common';
import typia from 'typia';

export class IsValidLotPipe implements PipeTransform<unknown, Lot> {
  readonly logger = new Logger(IsValidLotPipe.name);

  transform(value: unknown) {
    const res = typia.is<Lot>(value);
    if (!res) {
      const { errors }: typia.IValidation<Lot> = typia.validate<Lot>(value);
      this.logger.error(errors);
      throw new BadRequestException('Validation failed');
    }

    return value;
  }
}
