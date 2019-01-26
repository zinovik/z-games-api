import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class UserGateway {

  @SubscribeMessage('xxx')
  message(client: any, payload: any): string {
    return '[]';
  }

}
