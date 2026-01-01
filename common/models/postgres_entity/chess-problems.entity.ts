import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProblemCategory } from './';
import { ProblemDifficultyLevel } from '../../enums';

@Entity('chess_problems')
export class ChessProblem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => ProblemCategory)
  @JoinColumn({ name: 'category_id' })
  category: ProblemCategory;

  @Column({ type: 'text' })
  fen: string;

  @Column({ type: 'simple-array' })
  solutionMoves: string[];

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProblemDifficultyLevel,
  })
  difficultyLevel: ProblemDifficultyLevel;

  @Column({ default: false })
  isPayable: boolean;

  @Column({ default: true })
  isActive: boolean;
}
