import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Plan, Role } from '../../';

@Entity('UserRelatedData')
export class UserRelatedData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, default: Role.USER })
  role: string;

  @Column({ type: 'varchar', length: 20, default: Plan.FREE })
  plan: string;

  @Column({ type: 'bigint', default: 0 })
  xp: number;

  @Column({ type: 'int8', default: 0 })
  level: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
