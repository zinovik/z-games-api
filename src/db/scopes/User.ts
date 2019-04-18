// PostgreSQL

export const ALL_USER_FIELDS = [
  'user.id',
  'user.username',
  'user.avatar',
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
  'user.gamesPlayed',
  'user.gamesWon',
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

export const USER_JOIN_INVITES_INVITER: [string, string] = [
  'user.invitesInviter',
  'invitesInviter',
];

export const USER_JOIN_INVITES_INVITEE: [string, string] = [
  'user.invitesInvitee',
  'invitesInvitee',
];

// MongoDB

export const ALL_USER_FIELDS_MONGO =
  'id username avatar createdAt gamesPlayed gamesWon';

export const USER_FIELDS_MONGO =
  'id username password avatar email firstName lastName createdAt updatedAt isConfirmed gamesPlayed gamesWon';

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

export const USER_POPULATE_INVITES_INVITER: [string, string] = [
  'invitesInviter',
  `id`,
];

export const USER_POPULATE_INVITES_INVITEE: [string, string] = [
  'invitesInvitee',
  `id`,
];
