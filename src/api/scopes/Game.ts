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
