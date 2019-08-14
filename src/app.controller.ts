import { Get, Controller, Req, Request } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('echo')
  echo(@Req() request: Request): string {
    return JSON.stringify({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      remoteAddress: (request as any).connection.remoteAddress,
      ip: (request as any).ip,
    });
  }
}
