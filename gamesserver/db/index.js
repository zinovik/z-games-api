const redis = require('promise-redis')();

const redisClient = (process.env.REDIS_URL) ? redis.createClient(process.env.REDIS_URL) : redis.createClient('6379', '127.0.0.1');

function getServerInfo() {
  return redisClient.get('server-info')
    .then((serverInfoJSON) => {
      let serverInfo = {};
      if (serverInfoJSON === null) return Promise.resolve(serverInfo);
      try {
        serverInfo = JSON.parse(serverInfoJSON);
      } catch (e) {
        return Promise.resolve(serverInfo);
      }
      return Promise.resolve(serverInfo);
    });
}

function getGame(gameNumber) {

}

function setGame(gameNumber, gameData) {

}

function getUser(username) {

}

function setUser(username, userData) {

}

module.exports = {
  getServerInfo: getServerInfo,
  getGame: getGame,
  setGame: setGame,
  getUser: getUser,
  setUser: setUser,
};
