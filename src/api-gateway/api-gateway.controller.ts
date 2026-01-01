import {
  LoginDto,
  Pagination,
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
} from '../../common';
import {
  Req,
  Res,
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  Controller,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';

@Controller('api')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

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

  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.apiGatewayService.register(dto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    return await this.apiGatewayService.getUserById(id);
  }

  @Get('')
  async getUsers(@Pagination() dto: PaginationDto) {
    return await this.apiGatewayService.getUsers(dto);
  }

  @Patch(':id')
  async updateUserById(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return await this.apiGatewayService.updateUserById(id, dto);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: number) {
    return await this.apiGatewayService.deleteUserById(id);
  }

  @Post()
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

    return res
      .sendStatus(200)
      .json({ message: 'Tokens refreshed successfully' });
  }

  @Post()
  async logout(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = req.cookies;
    await this.apiGatewayService.logout(accessToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.sendStatus(200).json({ message: 'Logged out successfully' });
  }
}
