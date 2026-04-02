import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendFriendRequestDto {
  @ApiProperty({ example: 2, description: 'User id to send the request to' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  friendId: number;
}
