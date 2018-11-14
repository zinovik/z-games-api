import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import socketIo from 'socket.io';

import gamesServer from '../gamesserver';
// import { env } from '../env';
import session from '../session';

export const socketIoLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    const listen = (server) => {
        const io = socketIo.listen(server);

        // update all users
        function updateUsersOnline() {
            io.emit('updateUsersOnline', gamesServer.getUsersOnline());
        }

        function updateAllGamesInfo() {
            io.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
        }

        // update open game users
        function updateOpenGameInfo(username, gameNumber) {
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
        }

        io.use((socket, next) => {
            session(socket.request, socket.request.res, next);
        });

        io.on('connection', (socket) => {
            if (socket.request.session.name) {
                socket.request.session._garbage = Date();
                gamesServer.checkUsername(socket.request.session.name)
                    .then(() => {
                        gamesServer.authorize(socket.request.session.name, socket)
                            .then(() => {
                                socket.emit('setUsername', socket.request.session.name);
                                updateUsersOnline();
                            });
                    });
            }

            // update by browser request (e.g., page refresh)
            socket.on('getAllGamesInfo', () => {
                socket.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
            });

            socket.on('getOpenGameInfo', () => {
                if (socket.request.session.name) {
                    socket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(socket.request.session.name));
                }
            });

            socket.on('getUsersOnline', () => {
                socket.emit('updateUsersOnline', gamesServer.getUsersOnline());
            });

            socket.on('getCurrentUsername', () => {
                socket.emit('updateCurrentUsername', socket.request.session.name);
            });

            // authorize, register, logout
            socket.on('authorize', (username, password) => {
                gamesServer.checkPassword(username, password)
                    .then(() => {
                        return gamesServer.authorize(username, socket);
                    })
                    .then(() => {
                        socket.emit('updateCurrentUsername', username);
                        updateUsersOnline();
                        updateOpenGameInfo(username, undefined);
                        socket.request.session.name = username;
                        socket.request.session.save();
                    })
                    .catch(() => {
                        socket.emit('updateCurrentUsername', undefined);
                    });
            });

            socket.on('register', (username, password) => {
                gamesServer.register(username, password, socket)
                    .then(() => {
                        socket.emit('updateCurrentUsername', username);
                        updateUsersOnline();
                        socket.request.session.name = username;
                        socket.request.session.save();
                    })
                    .catch(() => {
                        socket.emit('updateCurrentUsername', undefined);
                    });
            });

            socket.on('logout', () => {
                if (socket.request.session.name) {
                    gamesServer.logout(socket.request.session.name)
                        .then((gameNumber) => {
                            socket.emit('updateCurrentUsername');
                            updateUsersOnline();
                            updateAllGamesInfo();
                            updateOpenGameInfo(undefined, gameNumber);
                            delete socket.request.session.name;
                            socket.request.session.save();
                        });
                }
            });

            socket.on('disconnect', () => {
                if (socket.request.session.name) {
                    gamesServer.logout(socket.request.session.name)
                        .then((gameNumber) => {
                            updateUsersOnline();
                            updateAllGamesInfo();
                            updateOpenGameInfo(undefined, gameNumber);
                        });
                }
            });

            // game actions
            socket.on('newgame', (gameName) => {
                if (gamesServer.newGame(gameName, socket.request.session.name)) {
                    updateAllGamesInfo();
                }
            });

            socket.on('joingame', (gameNumber) => {
                if (gamesServer.joinGame(socket.request.session.name, gameNumber)) {
                    updateUsersOnline();
                    updateAllGamesInfo();
                    updateOpenGameInfo(socket.request.session.name, undefined);
                }
            });

            socket.on('leavegame', () => {
                const gameNumber = gamesServer.leaveGame(socket.request.session.name);
                if (gameNumber || (gameNumber === 0)) {
                    updateUsersOnline();
                    updateAllGamesInfo();
                    updateOpenGameInfo(undefined, gameNumber);
                }
            });

            socket.on('readytogame', () => {
                gamesServer.readyToGame(socket.request.session.name);
                updateOpenGameInfo(socket.request.session.name, undefined);
            });

            socket.on('startgame', () => {
                gamesServer.startGame(socket.request.session.name);
                updateAllGamesInfo();
                updateOpenGameInfo(socket.request.session.name, undefined);
            });

            socket.on('move', (move) => {
                if (gamesServer.move(socket.request.session.name, move)) {
                    updateAllGamesInfo();
                }
                updateOpenGameInfo(socket.request.session.name, undefined);
            });

            socket.on('message', (message) => {
                gamesServer.addMessage(socket.request.session.name, message);
                updateOpenGameInfo(socket.request.session.name, undefined);
            });
        });
    };

    if (settings) {
        const expressServer = settings.getData('express_server');
        listen(expressServer);
    }
};
