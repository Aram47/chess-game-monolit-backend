import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('problem_categories')
export class ProblemCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  order: number;

  @Column({ default: true })
  isActive: boolean;
}
