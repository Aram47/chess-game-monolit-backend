import {
  User,
  LoginDto,
  AuthGuard,
  Pagination,
  UserDecorator,
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
  UserDecoratorDto,
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
  UseGuards,
  Controller,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import {
  ApiBody,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
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
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.apiGatewayService.register(dto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiCookieAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.apiGatewayService.getUserById(id);
  }

  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['ASC', 'DESC'], description: 'Sort direction' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiCookieAuth()
  @UseGuards(AuthGuard)
  @Get('')
  async getUsers(@Pagination() dto: PaginationDto) {
    return await this.apiGatewayService.getUsers(dto);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User successfully updated', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiCookieAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateUserById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UserDecorator() currentUser: UserDecoratorDto,
  ) {
    return await this.apiGatewayService.updateUserById(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Delete own account' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — can only delete own account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiCookieAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUserById(
    @Param('id', ParseIntPipe) id: number,
    @UserDecorator() currentUser: UserDecoratorDto,
  ) {
    return await this.apiGatewayService.deleteUserById(id, currentUser);
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token' })
  @Post('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie is missing');
    }

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
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      await this.apiGatewayService.logout(accessToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
