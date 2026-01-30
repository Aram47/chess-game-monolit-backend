import { LoginDto, CreateUserDto } from '../../../common';

export class DtoFactory {
  static buildLoginDto(overrides: Partial<LoginDto> = {}): LoginDto {
    return {
      login: 'johndoe',
      password: 'StrongP@ssw0rd!',
      ...overrides,
    };
  }

  static buildCreateUserDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      name: 'John',
      surname: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'StrongP@ssw0rd!',
      ...overrides,
    };
  }
}
