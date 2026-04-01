import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class StartBotGameDto {
  @ApiProperty({
    example: 'white',
    enum: ['white', 'black'],
    description: 'User preferred color in PvE game',
  })
  @IsIn(['white', 'black'])
  color: 'white' | 'black';

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Bot difficulty level',
  })
  @IsIn(['easy', 'medium', 'hard'])
  level: 'easy' | 'medium' | 'hard';
}

