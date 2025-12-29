import * as bcrypt from 'bcrypt';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  User,
  PaginationDto,
  CreateUserDto,
  UpdateUserDto,
  UserRelatedData,
} from '../../common';

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

  async getUserById(id: number) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRelatedData', 'userRelatedData')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUserById(id: number) {
    const res = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id = :id', { id })
      .returning([
        'id',
        'email',
        'username',
        'name',
        'surname',
        'createdAt',
        'updatedAt',
      ])
      .execute();

    if (!res.affected) throw new NotFoundException(`User ${id} not found`);

    // UserRelatedData row will be deleted by DB FK onDelete: 'CASCADE'
    return { deleted: true, deletedUser: res.raw[0] };
  }

  async updateUserById(id: number, dto: UpdateUserDto) {
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(dto)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    const updatedUser = result.raw[0];

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updatedUser;
  }

  async getUsers(p: PaginationDto) {
    const [users, total] = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userRelatedData', 'rd')
      .orderBy(`u.${p.sortBy}`, p.sortDir)
      .skip(p.skip)
      .take(p.limit)
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page: p.page,
        limit: p.limit,
        totalPages: Math.ceil(total / p.limit),
      },
    };
  }
}
