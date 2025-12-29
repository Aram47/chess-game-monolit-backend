import * as bcrypt from 'bcrypt';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRelatedData, CreateUserDto } from '../../common';
import { PaginationQuery } from '../../common/dtos/pagination/pagination.dto';

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
    // this.userRepository.createQueryBuilder().offset().skip().select().j
  }

  async getUsers(p: PaginationQuery) {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userRelatedData', 'rd');

    // search (optional)
    if (p.search?.trim()) {
      qb.andWhere(
        `(u.username ILIKE :s OR u.email ILIKE :s OR u.name ILIKE :s OR u.surname ILIKE :s)`,
        { s: `%${p.search.trim()}%` },
      );
    }

    // order (use what comes from controller)
    if (p.sortBy) {
      qb.orderBy(`u.${p.sortBy}`, p.sortDir);
    }

    // pagination
    const page = p.page ?? 1;
    const limit = p.limit ?? 20;

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

}
