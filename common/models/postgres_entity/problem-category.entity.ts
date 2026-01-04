import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('problem_categories')
export class ProblemCategory {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the problem category',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Tactics',
    description: 'Name of the problem category',
  })
  @Column()
  name: string;

  @ApiProperty({
    example:
      'Problems focusing on tactical motifs like forks, pins, and skewers',
    description: 'Description of the problem category',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 1,
    description: 'Order of the problem category for display purposes',
  })
  @Column()
  order: number;

  @ApiProperty({
    example: true,
    description: 'Indicates if the problem category is active',
  })
  @Column({ default: true })
  isActive: boolean;
}
