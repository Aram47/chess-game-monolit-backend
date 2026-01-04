import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  surname: string;

  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'johndoe@gmail.com' })
  @IsEmail()
  email: string;
}
