import {
  Entity,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRelatedData } from './user.related-data.entity';

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

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Password of the user',
  })
  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @ApiProperty({ example: 'a@gmail.com', description: 'Email of the user' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @OneToOne(() => UserRelatedData, (related) => related.user, {
    cascade: true,
  })
  userRelatedData: UserRelatedData;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
