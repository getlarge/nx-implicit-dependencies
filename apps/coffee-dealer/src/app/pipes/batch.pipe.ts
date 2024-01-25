import { Batch } from '@getlarge/ts-interfaces';
import { PipeTransform, BadRequestException, Logger } from '@nestjs/common';
import typia from 'typia';

export class IsValidBatchPipe implements PipeTransform<unknown, Batch> {
  readonly logger = new Logger(IsValidBatchPipe.name);

  transform(value: unknown) {
    const res = typia.is<Batch>(value);
    if (!res) {
      const { errors }: typia.IValidation<Batch> = typia.validate<Batch>(value);
      this.logger.error(errors);
      throw new BadRequestException('Validation failed');
    }

    return value;
  }
}
