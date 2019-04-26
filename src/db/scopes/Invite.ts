// PostgreSQL

// TODO: SQL Invite Scopes

// MongoDB

export const INVITE_FIELDS_MONGO = 'game invitee isClosed isAccepted isDeclined createdBy createdAt';

const INVITE_POPULATE_USERS = 'id username';

export const INVITE_POPULATE_GAME: [string, string] = [
  'game',
  'id name number',
];

export const INVITE_POPULATE_INVITEE: [string, string] = [
  'invitee',
  INVITE_POPULATE_USERS,
];

export const INVITE_POPULATE_CREATED_BY: [string, string] = [
  'createdBy',
  INVITE_POPULATE_USERS,
];
