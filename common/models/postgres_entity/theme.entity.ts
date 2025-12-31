import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: true })
  isActive: boolean;
}
