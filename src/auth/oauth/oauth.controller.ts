import { Request } from 'express';
import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { OauthRequestUser, GoogleOauthGuard } from '../../../common';

@Controller('/api/auth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Get('/google')
  @UseGuards(GoogleOauthGuard)
  googleAuth(): void {}

  @Get('/google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: OauthRequestUser },
    @Res() res: Response,
  ) {
    try {
      const result = await this.oauthService.handleGoogleCallback(
        req.user.profile,
      );
      const cookieOptions = this.oauthService.getAuthCookieOptions();
      res.cookie('accessToken', result.accessToken, cookieOptions);
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
      return res.redirect(this.oauthService.buildSuccessRedirectUrl(result));
    } catch {
      return res.redirect(this.oauthService.buildFailureRedirectUrl());
    }
  }
}
