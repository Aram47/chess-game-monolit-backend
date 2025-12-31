import {
  Index,
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChessProblem, Theme } from './';

@Entity('problem_themes')
@Index(['problemId', 'themeId'], { unique: true })
export class ProblemTheme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  problemId: number;

  @Column()
  themeId: number;

  @ManyToOne(() => ChessProblem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'problem_id' })
  problem: ChessProblem;

  @ManyToOne(() => Theme, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'theme_id' })
  theme: Theme;
}
