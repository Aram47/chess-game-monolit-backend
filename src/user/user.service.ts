import * as bcrypt from 'bcrypt';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { User, UserRelatedData, CreateUserDto } from '../../common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRelatedData)
    private readonly userRelatedDataRepository: Repository<UserRelatedData>,
    private readonly datasSource: DataSource,
  ) {}

  async createUser(dto: CreateUserDto) {
    const { email, username, password, name, surname } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return await this.datasSource.transaction(async (manager) => {
        const user = manager.create(User, {
          email,
          name,
          surname,
          username,
          password: hashedPassword,
          userRelatedData: {},
        });

        const saved = await manager.save(User, user);

        delete (saved as any).password;
        return saved;
      });
    } catch (e: any) {
      // Postgres unique violation
      if (e?.code === '23505') {
        throw new ConflictException('Email or username already exists');
      }
      throw e;
    }
  }
}
