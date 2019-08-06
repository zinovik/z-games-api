// PostgreSQL

export const ALL_USER_FIELDS = [
  'user.id',
  'user.username',
  'user.avatar',
  'user.createdAt',
  'user.previousVisitAt',
  'user.gamesPlayed',
  'user.gamesWon',
];

export const USER_FIELDS = [
  'user.id',
  'user.username',
  'user.password',
  'user.avatar',
  'user.notificationsToken',
  'user.email',
  'user.firstName',
  'user.lastName',
  'user.createdAt',
  'user.previousVisitAt',
  'user.updatedAt',
  'user.isConfirmed',
  'user.gamesPlayed',
  'user.gamesWon',
  'currentGames.number',
  'currentGames.id',
];

export const USER_JOIN_CURRENT_GAMES: [string, string] = ['user.currentGames', 'currentGames'];

export const USER_JOIN_INVITES_INVITER: [string, string] = ['user.invitesInviter', 'invitesInviter'];

export const USER_JOIN_INVITES_INVITEE: [string, string] = ['user.invitesInvitee', 'invitesInvitee'];

// MongoDB

export const ALL_USER_FIELDS_MONGO = 'id username avatar createdAt previousVisitAt gamesPlayed gamesWon';

export const USER_FIELDS_MONGO =
  'id username password avatar notificationsToken email firstName lastName createdAt previousVisitAt' +
  ' updatedAt isConfirmed gamesPlayed gamesWon invitesInviter invitesInvitee';

const USER_POPULATE_GAMES = 'id name number';

export const USER_POPULATE_CURRENT_GAMES: [string, string] = ['currentGames', USER_POPULATE_GAMES];

export const USER_POPULATE_INVITES_INVITER: [string, string] = ['invitesInviter', 'id game isClosed isAccepted isDeclined createdAt'];

export const USER_POPULATE_INVITES_INVITEE: [string, string] = ['invitesInvitee', 'id game isClosed isAccepted isDeclined createdAt'];

export const USER_POPULATE_INVITES_GAME: [string, string] = ['game', USER_POPULATE_GAMES];

export const USER_POPULATE_INVITES_INVITEE_USER: [string, string] = ['invitee', 'id username'];

export const USER_POPULATE_INVITES_CREATED_BY: [string, string] = ['createdBy', 'id username'];

export const INVITES_FIELD_ORDER_BY_MONGO = 'createdAt';
