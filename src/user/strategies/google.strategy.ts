import { OAuth2Strategy } from 'passport-google-oauth';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../../config/config.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy) {
  constructor() {
    const GOOGLE_CONSUMER_KEY = ConfigService.get().GOOGLE_CONSUMER_KEY;
    const GOOGLE_CONSUMER_SECRET = ConfigService.get().GOOGLE_CONSUMER_SECRET;
    const BASE_URL = ConfigService.get().BASE_URL;

    super({
      clientID: GOOGLE_CONSUMER_KEY || '',
      clientSecret: GOOGLE_CONSUMER_SECRET || '',
      callbackURL: `${BASE_URL}/api/users/authorize/google/callback`,
      scope: ['profile', 'email'],
      session: false,
      failureRedirect: '/signin',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: object) {
    return profile;
  }
}
