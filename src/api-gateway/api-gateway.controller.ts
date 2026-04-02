import { User, LoginDto, CreateUserDto } from '../../common';
import { Req, Res, Body, Post, Controller } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import {
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('API Gateway')
@Controller('api')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    type: User,
  })
  @Post('/login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.apiGatewayService.login(dto);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return user;
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: User,
  })
  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.apiGatewayService.register(dto);
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @Post('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { refreshToken } = req.cookies;
    const { newAccessToken, newRefreshToken } =
      await this.apiGatewayService.refresh(refreshToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Tokens refreshed successfully' });
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = req.cookies;
    await this.apiGatewayService.logout(accessToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  }

}
