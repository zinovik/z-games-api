import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { useSocketServer } from 'socket-controllers';
import socketIo from 'socket.io';
import { Container } from 'typedi';

import { GamesServer } from '../api/services/games';
import { AuthService } from '../auth/AuthService';

export const socketIoLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {

  if (!settings) {
    return undefined;
  }

  const expressServer = settings.getData('express_server');
  const io = socketIo.listen(expressServer);
  useSocketServer(io);

  const gamesServer: GamesServer = GamesServer.Instance;
  const authService = Container.get<AuthService>(AuthService);

  // update all users
  const updateUsersOnline = () => {
    io.emit('updateUsersOnline', gamesServer.getUsersOnline());
  };

  const updateAllGamesInfo = () => {
    io.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
  };

  // update open game users
  const updateOpenGameInfo = (username, gameNumber) => {
    const gamePlayers = gamesServer.getGamePlayers(username, gameNumber);

    gamePlayers.forEach((gamePlayer) => {
      const currentSocket = gamesServer.getSocket(gamePlayer.username);

      if (currentSocket && currentSocket.emit) {
        currentSocket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gamePlayer.username));
      }
    });

    const gameWatchers = gamesServer.getGameWatchers(username, gameNumber);

    gameWatchers.forEach((gameWatcher) => {
      const currentSocket = gamesServer.getSocket(gameWatcher.username);

      if (currentSocket) {
        currentSocket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gameWatcher.username));
      }
    });
  };

  io.on('connection', async socket => {
    const connectedUser = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

    if (connectedUser) {
      // socket.request.session._garbage = Date(); TODO: Update token
      updateUsersOnline();
    }

    // update by browser request (e.g., page refresh)
    socket.on('getAllGamesInfo', () => {
      socket.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
    });

    socket.on('getOpenGameInfo', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (user) {
        socket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(user.email));
      }
    });

    socket.on('getUsersOnline', () => {
      socket.emit('updateUsersOnline', gamesServer.getUsersOnline());
    });

    socket.on('getCurrentUsername', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      socket.emit('updateCurrentUsername', user && user.email);
    });

    socket.on('logout', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (user) {
        const gameNumber = await gamesServer.userOffline(user.email);

        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(undefined, gameNumber);
      }

      socket.emit('updateCurrentUsername', '');
    });

    socket.on('disconnect', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (user) {
        const gameNumber = await gamesServer.userOffline(user.email);

        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(undefined, gameNumber);
      }
    });

    // game actions
    socket.on('newGame', async (gameName) => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      await gamesServer.newGame(gameName, user.email);
      updateAllGamesInfo();
    });

    socket.on('joingame', async (gameNumber) => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      if (await gamesServer.joinGame(user.email, gameNumber)) {
        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(user.email, undefined);
      }
    });

    socket.on('leavegame', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      const gameNumber = await gamesServer.leaveGame(user.email);

      if (gameNumber || (gameNumber === 0)) {
        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(undefined, gameNumber);
      }
    });

    socket.on('readytogame', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      await gamesServer.readyToGame(user.email);
      updateOpenGameInfo(user.email, undefined);
    });

    socket.on('startgame', async () => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      await gamesServer.startGame(user.email);
      updateAllGamesInfo();
      updateOpenGameInfo(user.email, undefined);
    });

    socket.on('move', async (move) => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      if (await gamesServer.move(user.email, move)) {
        updateAllGamesInfo();
        updateOpenGameInfo(user.email, undefined);
      }
    });

    socket.on('message', async (message) => {
      const user = await authService.verifyAndDecodeJwt(socket.handshake.query.token);

      if (!user) {
        return;
      }

      await gamesServer.addMessage(user.email, message);
      updateOpenGameInfo(user.email, undefined);
    });
  });
};
