import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 255)
  login: string; // email OR username

  @IsString()
  @Length(8, 200)
  password: string;
}
