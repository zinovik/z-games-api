import {
  Authorized, Body, Delete, Get, JsonController, OnUndefined, Param, Post, Put
} from 'routing-controllers';

import { LogNotFoundError } from '../errors/LogNotFoundError';
import { Log } from '../models/Log';
import { LogService } from '../services/LogService';

@Authorized()
@JsonController('/logs')
export class LogController {

  constructor(
    private logService: LogService
  ) { }

  @Get()
  public find(): Promise<Log[]> {
    return this.logService.find();
  }

  @Get('/:id')
  @OnUndefined(LogNotFoundError)
  public one(@Param('id') id: string): Promise<Log | undefined> {
    return this.logService.findOne(id);
  }

  @Post()
  public create(@Body() log: Log): Promise<Log> {
    return this.logService.create(log);
  }

  @Put('/:id')
  public update(@Param('id') id: string, @Body() log: Log): Promise<Log> {
    return this.logService.update(id, log);
  }

  @Delete('/:id')
  public delete(@Param('id') id: string): Promise<void> {
    return this.logService.delete(id);
  }

}
