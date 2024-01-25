import { Batch, Lot, Reception } from '@getlarge/ts-interfaces';
import { Body, Controller, Get, Post } from '@nestjs/common';

import { AppService } from './app.service';
import { IsValidBatchPipe } from './pipes/batch.pipe';
import { IsValidReceptionPipe } from './pipes/reception.pipe';
import { IsValidLotPipe } from './pipes/lot.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('batch')
  batch(@Body(IsValidBatchPipe) body: Batch): Promise<Batch> {
    return this.appService.createBatch(body);
  }

  @Post('reception')
  reception(@Body(IsValidReceptionPipe) body: Reception): Promise<Reception> {
    return this.appService.createReception(body);
  }

  @Post('lot')
  lot(@Body(IsValidLotPipe) body: Lot): Promise<Lot> {
    return this.appService.createLot(body);
  }
}
