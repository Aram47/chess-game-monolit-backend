import {
  Entity,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRelatedData } from './user.related-data.entity';
import { AuthProviderEnum } from '../../enums';

@Entity('Users')
export class User {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @ApiProperty({ example: 'Doe', description: 'Surname of the user' })
  @Column({ type: 'varchar', length: 50 })
  surname: string;

  @ApiProperty({ example: 'johndoe', description: 'Username of the user' })
  @Column({ type: 'varchar', length: 20, unique: true })
  username: string;

  @ApiPropertyOptional({
    description:
      'Bcrypt hash for local accounts; null for OAuth-only (e.g. Google) sign-up',
  })
  @Column({ type: 'varchar', length: 100, select: false, nullable: true })
  password: string | null;

  @ApiProperty({ example: 'a@gmail.com', description: 'Email of the user' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @ApiProperty({ enum: AuthProviderEnum, default: AuthProviderEnum.LOCAL })
  @Column({ type: 'varchar', length: 20, default: AuthProviderEnum.LOCAL })
  authProvider: AuthProviderEnum;

  @OneToOne(() => UserRelatedData, (related) => related.user, {
    cascade: true,
  })
  userRelatedData: UserRelatedData;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
