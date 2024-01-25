import { Batch, Lot, Reception } from '@getlarge/ts-interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  createBatch(body: Batch): Promise<Batch> {
    return Promise.resolve(body);
  }

  createReception(body: Reception): Promise<Reception> {
    return Promise.resolve(body);
  }

  createLot(body: Lot): Promise<Lot> {
    return Promise.resolve(body);
  }
}
