import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../common';

@Injectable()
export class UserService {
	constructor() {}

	async createUser(dto: CreateUserDto) {}
}
