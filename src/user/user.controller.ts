import {
  Get,
  Patch,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  Controller,
  ParseIntPipe,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  AuthGuard,
  UserDecorator,
  UserDecoratorDto,
  UpdateProfileDto,
  ChangePasswordDto,
  SendFriendRequestDto,
  UserMeProfileResponseDto,
  UserPublicProfileResponseDto,
  FriendshipRowDto,
  PendingFriendshipsDto,
} from '../../common';
import { UserProfileService } from './user-profile.service';
import { UserFriendService } from './user-friend.service';

@ApiTags('User Service')
@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('user-service')
export class UserController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly userFriendService: UserFriendService,
  ) {}

  @ApiOperation({ summary: 'Get my profile (includes email) for viewing and editing' })
  @ApiResponse({ status: 200, type: UserMeProfileResponseDto })
  @Get('profile/me')
  async getMyProfile(@UserDecorator() user: UserDecoratorDto) {
    return this.userProfileService.getProfileById(user.sub, true);
  }

  @ApiOperation({ summary: 'Update my profile (name, surname, username, email)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, type: UserMeProfileResponseDto })
  @Patch('profile/me')
  async patchMyProfile(
    @UserDecorator() user: UserDecoratorDto,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userProfileService.updateMyProfile(user.sub, dto);
  }

  @ApiOperation({
    summary:
      'Change password (local accounts only; OAuth-only accounts receive 403)',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, type: UserMeProfileResponseDto })
  @Patch('profile/me/password')
  async patchMyPassword(
    @UserDecorator() user: UserDecoratorDto,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userProfileService.changeMyPassword(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get another user public profile (no email)' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({ status: 200, type: UserPublicProfileResponseDto })
  @Get('profile/:userId')
  async getPublicProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.userProfileService.getProfileById(userId, false);
  }

  @ApiOperation({ summary: 'Send a friend request' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({ status: 201, type: FriendshipRowDto })
  @HttpCode(201)
  @Post('friends/request')
  async sendFriendRequest(
    @UserDecorator() user: UserDecoratorDto,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.userFriendService.sendRequest(user.sub, dto.friendId);
  }

  @ApiOperation({ summary: 'Accept an incoming friend request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FriendshipRowDto })
  @Patch('friends/:id/accept')
  async acceptFriendRequest(
    @UserDecorator() user: UserDecoratorDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userFriendService.accept(id, user.sub);
  }

  @ApiOperation({ summary: 'Reject an incoming friend request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FriendshipRowDto })
  @Patch('friends/:id/reject')
  async rejectFriendRequest(
    @UserDecorator() user: UserDecoratorDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userFriendService.reject(id, user.sub);
  }

  @ApiOperation({
    summary:
      'Remove an accepted friendship, cancel an outgoing pending request, or clear a rejected row',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Removed' })
  @Delete('friends/:id')
  async deleteFriendship(
    @UserDecorator() user: UserDecoratorDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userFriendService.removeOrCancel(id, user.sub);
    return { removed: true };
  }

  @ApiOperation({ summary: 'List accepted friends' })
  @ApiResponse({ status: 200, type: [FriendshipRowDto] })
  @Get('friends')
  async listFriends(@UserDecorator() user: UserDecoratorDto) {
    return this.userFriendService.listAcceptedFriends(user.sub);
  }

  @ApiOperation({ summary: 'List pending friend requests (incoming and outgoing)' })
  @ApiResponse({ status: 200, type: PendingFriendshipsDto })
  @Get('friends/pending')
  async listPendingFriends(@UserDecorator() user: UserDecoratorDto) {
    return this.userFriendService.listPending(user.sub);
  }
}
