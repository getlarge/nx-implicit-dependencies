import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CallCoffeeDealerCommand } from './call-coffee-dealer.command';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ?? '3000';

@Module({
  imports: [
    HttpModule.register({
      baseURL: `http://${host}:${port}`,
    }),
  ],
  controllers: [],
  providers: [CallCoffeeDealerCommand],
})
export class AppModule {}
