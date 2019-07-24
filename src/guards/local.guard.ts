import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalGuard extends AuthGuard('local') implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
