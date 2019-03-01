// PostgreSQL

export const ALL_GAMES_FIELDS = [
  'game.number',
  'game.name',
  'game.state',
  'game.playersMax',
  'game.playersMin',
  'game.isPrivate',
  'game.createdAt',
  'game.updatedAt',
  'players.username',
];

export const ALL_GAMES_JOIN_PLAYERS: [string, string] = [
  'game.players',
  'players',
];

export const OPEN_GAME_FIELDS = [
  ...ALL_GAMES_FIELDS,
  'game.id',
  'game.gameData',
  'players.username',
  'players.id',
  'players.avatar',
  'players.gamesPlayed',
  'players.gamesWon',
  'watchers.username',
  'watchers.id',
  'playersOnline.username',
  'playersOnline.id',
  'nextPlayers.username',
  'nextPlayers.id',
  'logs.type',
  'logs.text',
  'logs.createdAt',
  'logs.id',
  'user.username',
];

export const OPEN_GAME_JOIN_WATCHERS: [string, string] = [
  'game.watchers',
  'watchers',
];

export const OPEN_GAME_JOIN_PLAYERS_ONLINE: [string, string] = [
  'game.playersOnline',
  'playersOnline',
];

export const OPEN_GAME_JOIN_NEXT_PLAYERS: [string, string] = [
  'game.nextPlayers',
  'nextPlayers',
];

export const OPEN_GAME_JOIN_LOGS: [string, string] = [
  'game.logs',
  'logs',
];

export const OPEN_GAME_JOIN_LOGS_USERNAMES: [string, string] = [
  'logs.user',
  'user',
];

export const FIELDS_TO_REMOVE_IN_ALL_GAMES = [
  'id',
  'gameData',
  'watchers',
  'playersOnline',
  'nextPlayers',
  'logs',
];

export const LOGS_FIELD_ORDER_BY = 'logs.createdAt';

// MongoDB

export const ALL_GAMES_FIELDS_MONGO = 'number name state playersMax playersMin isPrivate createdAt updatedAt';

export const ALL_GAMES_POPULATE_PLAYERS: [string, string] = [
  'players',
  'username',
];

export const OPEN_GAME_FIELDS_MONGO = `${ALL_GAMES_FIELDS_MONGO} id gameData`;

const GAME_POPULATE_USERS = 'id username';

export const OPEN_GAME_POPULATE_WATCHERS: [string, string] = [
  'watchers',
  GAME_POPULATE_USERS,
];

export const OPEN_GAME_POPULATE_PLAYERS_ONLINE: [string, string] = [
  'playersOnline',
  GAME_POPULATE_USERS,
];

export const OPEN_GAME_POPULATE_NEXT_PLAYERS: [string, string] = [
  'nextPlayers',
  GAME_POPULATE_USERS,
];

export const OPEN_GAME_POPULATE_LOGS: [string, string] = [
  'logs',
  'type text createdAt id',
];

export const OPEN_GAME_POPULATE_LOGS_USERNAMES: [string, string] = [
  'user',
  GAME_POPULATE_USERS,
];

export const LOGS_FIELD_ORDER_BY_MONGO = 'createdAt';
