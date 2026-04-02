import * as bcrypt from 'bcrypt';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  User,
  AuthProviderEnum,
  PaginationDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserRelatedData,
} from '../../common';
import { DeleteResult, QueryFailedError } from 'typeorm';

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
          authProvider: AuthProviderEnum.LOCAL,
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

  async createOAuthUser(params: {
    email: string;
    username: string;
    name: string;
    surname: string;
  }) {
    const { email, username, name, surname } = params;
    try {
      return await this.datasSource.transaction(async (manager) => {
        const user = manager.create(User, {
          email,
          name,
          surname,
          username,
          password: null,
          authProvider: AuthProviderEnum.GOOGLE,
          userRelatedData: {},
        });

        const saved = await manager.save(User, user);
        delete (saved as any).password;
        return saved;
      });
    } catch (e: any) {
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
    const res: DeleteResult = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    if (!res.affected) throw new NotFoundException(`User ${id} not found`);

    // UserRelatedData row will be deleted by DB FK onDelete: 'CASCADE'
    const deletedUser = this.toUserResponse(res.raw[0]);
    return { deleted: true, deletedUser: deletedUser };
  }

  async updateUserProfile(id: number, dto: UpdateProfileDto) {
    const patch: Partial<Pick<User, 'name' | 'surname' | 'username' | 'email'>> =
      {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.surname !== undefined) patch.surname = dto.surname;
    if (dto.username !== undefined) patch.username = dto.username;
    if (dto.email !== undefined) patch.email = dto.email;

    if (Object.keys(patch).length === 0) {
      return this.getUserById(id);
    }

    try {
      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set(patch)
        .where('id = :id', { id })
        .returning('*')
        .execute();

      if (!result.raw[0]) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).code === '23505') {
        throw new ConflictException('Email or username already exists');
      }
      throw e;
    }

    return this.getUserById(id);
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

    return this.toUserResponse(updatedUser);
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
      users,
      meta: {
        total,
        page: p.page,
        limit: p.limit,
        totalPages: Math.ceil(total / p.limit),
      },
    };
  }

  async getProfileAuthFlags(userId: number): Promise<{
    authProvider: AuthProviderEnum;
    canChangePassword: boolean;
  }> {
    const row = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.authProvider'])
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return {
      authProvider: row.authProvider,
      canChangePassword:
        row.authProvider === AuthProviderEnum.LOCAL && !!row.password,
    };
  }

  async changePasswordForUser(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.authProvider !== AuthProviderEnum.LOCAL || !user.password) {
      throw new ForbiddenException(
        'This account uses Google sign-in. Password is not managed here.',
      );
    }

    const currentOk = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!currentOk) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update({ id: userId }, { password: hashedPassword });
  }

  async getUserByLoginWithPassword(login: string) {
    const value = login.trim();

    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password') // because select:false
      .leftJoinAndSelect('u.userRelatedData', 'rd')
      .where('LOWER(u.email) = LOWER(:value)', { value })
      .orWhere('u.username = :value', { value })
      .getOne();
  }

  toUserResponse(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
