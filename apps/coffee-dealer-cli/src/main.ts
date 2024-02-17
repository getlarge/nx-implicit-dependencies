import { CommandFactory } from 'nest-commander';
import { AppModule } from './app/app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, ['log', 'warn', 'error']);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
