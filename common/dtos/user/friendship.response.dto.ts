import { ApiProperty } from '@nestjs/swagger';
import { FriendshipStatus } from '../../enums';
import { PublicUserSnippetDto } from './user-profile.response.dto';

export class FriendshipRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: FriendshipStatus })
  status: FriendshipStatus;

  @ApiProperty({ description: 'User id who sent the pending request' })
  requestedBy: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: PublicUserSnippetDto })
  otherUser: PublicUserSnippetDto;
}

export class PendingFriendshipsDto {
  @ApiProperty({ type: [FriendshipRowDto] })
  incoming: FriendshipRowDto[];

  @ApiProperty({ type: [FriendshipRowDto] })
  outgoing: FriendshipRowDto[];
}
