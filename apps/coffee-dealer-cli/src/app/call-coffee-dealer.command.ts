import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { lastValueFrom, tap } from 'rxjs';

@Command({ name: 'call', description: 'Call coffee-dealer API' })
export class CallCoffeeDealerCommand extends CommandRunner {
  readonly logger = new Logger(CallCoffeeDealerCommand.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async run(): Promise<void> {
    await lastValueFrom(
      this.httpService.get(`/api`).pipe(
        tap({
          next: (response) => {
            this.logger.log(response.data);
          },
          error: (error) => {
            this.logger.error(error);
          },
        })
      )
    );
  }
}
