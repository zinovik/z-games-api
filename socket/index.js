module.exports = function(server) {

    var io = require('socket.io').listen(server);
    var session = require('../session');
    var gamesServer = require('../gamesserver');

    io.use(function(socket, next) {
        session(socket.request, socket.request.res, next);  
    })

    io.on('connection', function(socket){
        if (socket.request.session.name) {
            if (gamesServer.checkUsername(socket.request.session.name) && gamesServer.authorize(socket.request.session.name, socket)) {
                socket.emit('setUsername', socket.request.session.name);
            }
        }

        // update by browser request (e.g., page refresh)
        socket.on('getAllGamesInfo', function() {
            socket.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
        });

        socket.on('getOpenGameInfo', function() {
            socket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(socket.request.session.name));
        });

        socket.on('getUsersOnline', function() {
            socket.emit('updateUsersOnline', gamesServer.getUsersOnline());
        });

        socket.on('getCurrentUsername', function() {
            socket.emit('updateCurrentUsername', socket.request.session.name);
        });

        // authorize, register, logout
        socket.on('authorize', function(username, password) {
            if (gamesServer.checkPassword(username, password) && gamesServer.authorize(username, socket)) {
                socket.emit('updateCurrentUsername', username);
                updateUsersOnline();
                updateOpenGameInfo(username);
                socket.request.session.name = username;
                socket.request.session.save();
            }
        });

        socket.on('register', function(username, password) {
            if (gamesServer.register(username, password, socket)) {
                socket.emit('updateCurrentUsername', username);
                updateUsersOnline();
                socket.request.session.name = username;
                socket.request.session.save();
            }
        });

        socket.on('logout', function() {
            if (gamesServer.logout(socket.request.session.name)) {
                socket.emit('updateCurrentUsername');
                updateUsersOnline();
                delete socket.request.session.name;
                socket.request.session.save();
            }
        });

        socket.on('disconnect', function() {
            if (socket.request.session.name) {
                gamesServer.logout(socket.request.session.name);
                updateUsersOnline();
            }
        });

        // game actions
        socket.on('newgame', function(gameName) {
            if (gamesServer.newGame(gameName, socket.request.session.name)) {
                updateAllGamesInfo();
            }
        });

        socket.on('joingame', function(gameNumber) {
            if (gamesServer.joinGame(socket.request.session.name, gameNumber)) {
                updateUsersOnline();
                updateAllGamesInfo();
                updateOpenGameInfo(socket.request.session.name);
            }
        });

        socket.on('leavegame', function(){
            let gameNumber = gamesServer.leaveGame(socket.request.session.name);
            if (gameNumber || (gameNumber === 0)) {
                updateUsersOnline();
                updateAllGamesInfo();
                updateOpenGameInfo(null, gameNumber);
            }
        });

        socket.on('readytogame', function() {
            gamesServer.readyToGame(socket.request.session.name);
            updateOpenGameInfo(socket.request.session.name);
        });

        socket.on('startgame', function() {
            gamesServer.startGame(socket.request.session.name);
            updateAllGamesInfo();
            updateOpenGameInfo(socket.request.session.name);
        });

        socket.on('move', function(move) {
            if (gamesServer.move(socket.request.session.name, move)) {
                updateAllGamesInfo();
            }
            updateOpenGameInfo(socket.request.session.name);
        });

        socket.on('message', function(message) {
            gamesServer.addMessage(socket.request.session.name, message);
            updateOpenGameInfo(socket.request.session.name);
        });



        // update all users
        function updateUsersOnline() {
            io.emit('updateUsersOnline', gamesServer.getUsersOnline());
        }

        function updateAllGamesInfo() {
            io.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
        }

        // update open game users
        function updateOpenGameInfo(username, gameNumber) {
            let gamePlayers = gamesServer.getGamePlayers(username, gameNumber);
            for (let i = 0; i < gamePlayers.length; i++) {
                gamesServer.getSocket(gamePlayers[i].username).emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gamePlayers[i].username));
            }
            let gameWatchers = gamesServer.getGameWatchers(username, gameNumber);
            for (let i = 0; i < gameWatchers.length; i++) {
                gamesServer.getSocket(gameWatchers[i].username).emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gameWatchers[i].username));
            }
        }
    });
}