export const USER_FIELDS = [
  'user.id',
  'user.username',
  'user.password',
  'user.email',
  'user.firstName',
  'user.lastName',
  'user.createdAt',
  'user.updatedAt',
  'openedGame.number',
  'openedGame.id',
];

export const USER_JOIN_OPENED_GAME: [string, string] = [
  'user.openedGame',
  'openedGame',
];
