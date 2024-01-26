import { Batch, Lot, Reception } from '@getlarge/ts-interfaces';
import { TypedBody, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TypedRoute.Get()
  getData(): { message: string } {
    return this.appService.getData();
  }

  @TypedRoute.Post('batch')
  batch(@TypedBody() body: Batch): Promise<Batch> {
    return this.appService.createBatch(body);
  }

  @TypedRoute.Post('reception')
  reception(@TypedBody() body: Reception): Promise<Reception> {
    return this.appService.createReception(body);
  }

  @TypedRoute.Post('lot')
  lot(@TypedBody() body: Lot): Promise<Lot> {
    return this.appService.createLot(body);
  }
}
