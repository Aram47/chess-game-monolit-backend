import { Request } from 'express';
import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { ENV_VARIABLES, OauthRequestUser, GoogleOauthGuard } from '../../../common';

@Controller('/api/auth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/google')
  @UseGuards(GoogleOauthGuard)
  googleAuth(): void {}

  @Get('/google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: OauthRequestUser },
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>(ENV_VARIABLES.FRONTEND_URL) || '/';

    try {
      const result = await this.oauthService.handleGoogleCallback(
        req.user.profile,
      );
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      const encodedUser = encodeURIComponent(JSON.stringify(result.user));
      const callbackUrl = result.redirectTo || `${frontendUrl}/auth/callback`;
      return res.redirect(`${callbackUrl}?user=${encodedUser}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?oauth=failed`);
    }
  }
}
