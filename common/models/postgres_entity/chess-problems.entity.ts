import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MoveType } from '../../';
import { ProblemCategory } from './';
import { ApiProperty } from '@nestjs/swagger';
import { ProblemDifficultyLevel } from '../../enums';

@Entity('chess_problems')
export class ChessProblem {
  @ApiProperty({ example: 1, description: 'Unique identifier for the problem' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProblemCategory)
  @JoinColumn({ name: 'category_id' })
  category: ProblemCategory;

  @ApiProperty({
    example: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    description: 'FEN string representing the chess position',
  })
  @Column({ type: 'text' })
  fen: string;

  @ApiProperty({
    example: ['e4', 'e5', 'Nf3', 'Nc6'],
    description: 'Sequence of moves that solve the problem',
    type: [String],
  })
  @Column({ type: 'simple-array' })
  solutionMoves: MoveType[];

  @ApiProperty({
    example: 'Mate in two moves',
    description: 'Description of the chess problem',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 'Easy',
    description: 'Difficulty level of the chess problem',
  })
  @Column({
    type: 'enum',
    enum: ProblemDifficultyLevel,
  })
  difficultyLevel: ProblemDifficultyLevel;

  @ApiProperty({
    example: false,
    description: 'Indicates if the problem is payable',
  })
  @Column({ default: false })
  isPayable: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the problem is active',
  })
  @Column({ default: true })
  isActive: boolean;
}
