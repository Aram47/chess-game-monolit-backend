import {
  Entity,
  Column,
  Check,
  Unique,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { FriendshipStatus } from '../../enums';

/**
 * One row per unordered pair of users.
 * DB columns `userId` / `friendId` always satisfy userId < friendId (canonical order).
 * Relation `user` is the account with id = userId; `friend` is the account with id = friendId.
 */
@Entity('UserFriends')
@Unique(['user', 'friend'])
@Check(`"userId" < "friendId"`)
@Check(`"requestedBy" IN ("userId", "friendId")`)
export class UserFriend {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friendId' })
  friend: User;

  @ApiProperty({ enum: FriendshipStatus })
  @Column({ type: 'varchar', length: 20 })
  status: FriendshipStatus;

  @ApiProperty()
  @Column({ type: 'int' })
  requestedBy: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
