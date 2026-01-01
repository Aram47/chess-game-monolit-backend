import { IsEmail } from 'class-validator';

export class UserDecoratorDto {
  sub: number;
  @IsEmail()
  email: string;
  role: string;
}
