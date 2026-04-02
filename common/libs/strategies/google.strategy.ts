import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ENV_VARIABLES } from '../../constants';
import { GoogleOauthProfileDto } from '../../dtos/auth';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(ENV_VARIABLES.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        ENV_VARIABLES.GOOGLE_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(
        ENV_VARIABLES.GOOGLE_CALLBACK_URL,
      ),
      scope: ['openid', 'profile', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const mappedProfile: GoogleOauthProfileDto = {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value || '',
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      picture: profile.photos?.[0]?.value,
    };

    done(null, { profile: mappedProfile });
  }
}
