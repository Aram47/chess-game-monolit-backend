import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  surname: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsStrongPassword()
  password: string;

  @IsEmail()
  email: string;
}

// We will add this part in services for
// correct working of Transform decorator

// app.useGlobalPipes(
//   new ValidationPipe({
//     whitelist: true,    // удаляет лишние поля
//     forbidNonWhitelisted: true, // кидает ошибку если есть лишние поля
//     transform: true,    // **обязателен для работы @Transform**
//   }),
// );
