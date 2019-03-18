export interface IGoogleProfile {
  emails: Array<{
    value: string;
  }>;

  displayName: string;

  name: {
    givenName: string;
    familyName: string;
  };

  photos: Array<{
    value: string;
  }>;
}
