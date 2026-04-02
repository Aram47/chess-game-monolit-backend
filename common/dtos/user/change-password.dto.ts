import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldStr0ng!' })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  currentPassword: string;

  @ApiProperty({ example: 'NewStr0ng!' })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsStrongPassword()
  newPassword: string;
}
