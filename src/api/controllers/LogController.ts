import { Authorized, Body, Get, JsonController, Post } from 'routing-controllers';

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

  @Post()
  public create(@Body() log: Log): Promise<Log> {
    return this.logService.create(log);
  }

}
