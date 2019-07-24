// PostgreSQL

export const ALL_GAMES_FIELDS = [
  'game.number',
  'game.name',
  'game.state',
  'game.playersMax',
  'game.playersMin',
  'game.isPrivate',
  'game.isMoveTimeout',
  'game.createdAt',
  'game.updatedAt',
  'game.createdBy',
  'game.previousMoveAt',
  'players.username',
  'players.id',
  'nextPlayers.username',
  'nextPlayers.id',
];

export const ALL_GAMES_JOIN_CREATED_BY: [string, string] = ['game.createdBy', 'createdBy'];

export const ALL_GAMES_JOIN_PLAYERS: [string, string] = ['game.players', 'players'];

export const ALL_GAMES_JOIN_NEXT_PLAYERS: [string, string] = ['game.nextPlayers', 'nextPlayers'];

export const OPEN_GAME_FIELDS = [
  ...ALL_GAMES_FIELDS,
  'game.id',
  'game.gameData',
  'players.username',
  'players.id',
  'players.avatar',
  'players.gamesPlayed',
  'players.gamesWon',
  'watchersOnline.username',
  'watchersOnline.id',
  'playersOnline.username',
  'playersOnline.id',
  'logs.type',
  'logs.text',
  'logs.createdAt',
  'logs.id',
  'createdBy.username',
];

export const OPEN_GAME_JOIN_WATCHERS: [string, string] = ['game.watchersOnline', 'watchersOnline'];

export const OPEN_GAME_JOIN_PLAYERS_ONLINE: [string, string] = ['game.playersOnline', 'playersOnline'];

export const OPEN_GAME_JOIN_LOGS: [string, string] = ['game.logs', 'logs'];

export const OPEN_GAME_JOIN_LOGS_USERNAMES: [string, string] = ['logs.createdBy', 'createdBy'];

export const FIELDS_TO_REMOVE_IN_ALL_GAMES = ['gameData', 'watchersOnline', 'playersOnline', 'nextPlayers', 'logs'];

export const LOGS_FIELD_ORDER_BY = 'logs.createdAt';

// MongoDB

export const ALL_GAMES_FIELDS_MONGO = 'number name state playersMax playersMin isPrivate isMoveTimeout createdAt updatedAt createdBy previousMoveAt';

const GAME_POPULATE_USERS = 'id username';

export const ALL_GAMES_POPULATE_CREATED_BY: [string, string] = ['createdBy', GAME_POPULATE_USERS];

export const ALL_GAMES_POPULATE_PLAYERS: [string, string] = ['players', 'username avatar gamesPlayed gamesWon'];

export const ALL_GAMES_POPULATE_NEXT_PLAYERS: [string, string] = ['nextPlayers', 'username avatar gamesPlayed gamesWon'];

export const OPEN_GAME_FIELDS_MONGO = `${ALL_GAMES_FIELDS_MONGO} id gameData`;

export const OPEN_GAME_POPULATE_WATCHERS: [string, string] = ['watchersOnline', GAME_POPULATE_USERS];

export const OPEN_GAME_POPULATE_PLAYERS_ONLINE: [string, string] = ['playersOnline', GAME_POPULATE_USERS];

export const OPEN_GAME_POPULATE_NEXT_PLAYERS: [string, string] = ['nextPlayers', GAME_POPULATE_USERS];

export const OPEN_GAME_POPULATE_LOGS: [string, string] = ['logs', 'type text createdAt id'];

export const OPEN_GAME_POPULATE_LOGS_USERNAMES: [string, string] = ['createdBy', GAME_POPULATE_USERS];

export const LOGS_FIELD_ORDER_BY_MONGO = 'createdAt';
