import { PartialType } from '@nestjs/mapped-types';
import { UserRelatedDataDto } from './user.related-data.dto';

export class UserUpdateRelatedDataDto extends PartialType(UserRelatedDataDto) {}
