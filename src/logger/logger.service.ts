import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  public error(message: string, trace: string): void {
    super.error(message, trace);
  }

  public info(message: string): void {
    super.log(message);
  }

  public warn(message: string): void {
    super.warn(message);
  }
}
