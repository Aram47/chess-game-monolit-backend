import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { User, UserRelatedData, CreateUserDto } from '../../common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRelatedData)
    private readonly userRelatedDataRepository: Repository<UserRelatedData>,
  ) {}

  async createUser(dto: CreateUserDto) {
    const { email, username, password, name, surname } = dto;

    // const exist = await this.userRepository.findOne({
    //   where: [{ email }, { username }],
    // });

    // if (exist) {
    //   throw new BadRequestException('User already exist');
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
  }
}
