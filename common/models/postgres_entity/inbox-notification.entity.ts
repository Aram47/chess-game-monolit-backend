import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('InboxNotifications')
@Index(['userId', 'readAt'])
@Index(['userId', 'createdAt'])
export class InboxNotification {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Recipient user id' })
  @Column()
  userId: number;

  @ApiProperty({ example: 'friend.request.accepted' })
  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
