// PostgreSQL

export const ALL_USER_FIELDS = [
  'user.id',
  'user.username',
  'user.avatar',
  'user.firstName',
  'user.lastName',
  'user.createdAt',
  'user.gamesPlayed',
  'user.gamesWon',
];

export const USER_FIELDS = [
  'user.id',
  'user.username',
  'user.password',
  'user.avatar',
  'user.email',
  'user.firstName',
  'user.lastName',
  'user.createdAt',
  'user.updatedAt',
  'user.isConfirmed',
  'openedGame.number',
  'openedGame.id',
  'currentGames.number',
  'currentGames.id',
  'currentWatch.number',
  'currentWatch.id',
];

export const USER_JOIN_OPENED_GAME: [string, string] = [
  'user.openedGame',
  'openedGame',
];

export const USER_JOIN_CURRENT_GAMES: [string, string] = [
  'user.currentGames',
  'currentGames',
];

export const USER_JOIN_CURRENT_WATCH: [string, string] = [
  'user.currentWatch',
  'currentWatch',
];

// MongoDB

export const ALL_USER_FIELDS_MONGO =
  'id username avatar firstName lastName createdAt gamesPlayed gamesWon';

export const USER_FIELDS_MONGO =
  'id username password avatar email firstName lastName createdAt updatedAt isConfirmed';

const USER_POPULATE_GAMES = 'id number';

export const USER_POPULATE_OPENED_GAME: [string, string] = [
  'openedGame',
  USER_POPULATE_GAMES,
];

export const USER_POPULATE_CURRENT_GAMES: [string, string] = [
  'currentGames',
  USER_POPULATE_GAMES,
];

export const USER_POPULATE_CURRENT_WATCH: [string, string] = [
  'currentWatch',
  USER_POPULATE_GAMES,
];
