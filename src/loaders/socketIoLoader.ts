import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { useSocketServer } from 'socket-controllers';
import socketIo from 'socket.io';

export const socketIoLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {

  if (!settings) {
    return undefined;
  }

  const expressServer = settings.getData('express_server');
  const io = socketIo.listen(expressServer);
  useSocketServer(io);

};
