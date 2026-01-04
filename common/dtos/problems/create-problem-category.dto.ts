import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateProblemCategoryDto {
  @ApiProperty({
    example: 'Tactics',
    description: 'Name of the problem category',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Problems focusing on tactical motifs',
    description: 'Description of the problem category',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
  })
  @IsBoolean()
  isActive: boolean;
}
