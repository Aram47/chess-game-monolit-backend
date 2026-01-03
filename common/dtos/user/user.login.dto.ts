import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe or johndoe@gmail.com',
    description: 'Username or email of the user',
  })
  @IsString()
  @Length(3, 255)
  login: string; // email OR username

  @ApiProperty({
    example: 'strongPassword123&&',
    description: 'Password of the user',
  })
  @IsString()
  @Length(8, 200)
  password: string;
}
