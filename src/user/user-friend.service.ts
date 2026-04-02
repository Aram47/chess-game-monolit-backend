import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  User,
  UserFriend,
  FriendshipStatus,
  FriendshipRowDto,
  PendingFriendshipsDto,
  PublicUserSnippetDto,
} from '../../common';

@Injectable()
export class UserFriendService {
  constructor(
    @InjectRepository(UserFriend)
    private readonly friendRepo: Repository<UserFriend>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private canonicalPair(a: number, b: number): [number, number] {
    return a < b ? [a, b] : [b, a];
  }

  private async findByPair(
    userA: number,
    userB: number,
  ): Promise<UserFriend | null> {
    const [lo, hi] = this.canonicalPair(userA, userB);
    return this.friendRepo.findOne({
      where: {
        user: { id: lo },
        friend: { id: hi },
      },
      relations: ['user', 'friend'],
    });
  }

  private async loadWithRelations(id: number): Promise<UserFriend | null> {
    return this.friendRepo.findOne({
      where: { id },
      relations: [
        'user',
        'friend',
        'user.userRelatedData',
        'friend.userRelatedData',
      ],
    });
  }

  private toSnippet(user: User): PublicUserSnippetDto {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      elo: user.userRelatedData?.elo ?? 1500,
    };
  }

  private otherUser(row: UserFriend, me: number): User {
    const uid = row.user.id;
    return uid === me ? row.friend : row.user;
  }

  private rowToDto(row: UserFriend, me: number): FriendshipRowDto {
    return {
      id: row.id,
      status: row.status,
      requestedBy: row.requestedBy,
      createdAt: row.createdAt,
      otherUser: this.toSnippet(this.otherUser(row, me)),
    };
  }

  private assertParticipant(row: UserFriend, userId: number) {
    const uid = row.user.id;
    const fid = row.friend.id;
    if (uid !== userId && fid !== userId) {
      throw new ForbiddenException('You are not part of this friendship');
    }
  }

  async sendRequest(fromUserId: number, targetUserId: number): Promise<FriendshipRowDto> {
    if (fromUserId === targetUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const target = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const [lo, hi] = this.canonicalPair(fromUserId, targetUserId);
    const existing = await this.findByPair(fromUserId, targetUserId);

    if (!existing) {
      const created = this.friendRepo.create({
        user: { id: lo },
        friend: { id: hi },
        requestedBy: fromUserId,
        status: FriendshipStatus.PENDING,
      });
      const saved = await this.friendRepo.save(created);
      const full = await this.loadWithRelations(saved.id);
      return this.rowToDto(full!, fromUserId);
    }

    if (
      existing.status === FriendshipStatus.ACCEPTED ||
      existing.status === FriendshipStatus.PENDING
    ) {
      throw new ConflictException('A friendship or pending request already exists');
    }

    existing.requestedBy = fromUserId;
    existing.status = FriendshipStatus.PENDING;
    await this.friendRepo.save(existing);
    const full = await this.loadWithRelations(existing.id);
    return this.rowToDto(full!, fromUserId);
  }

  async accept(rowId: number, currentUserId: number): Promise<FriendshipRowDto> {
    const row = await this.loadWithRelations(rowId);
    if (!row) {
      throw new NotFoundException('Friend request not found');
    }

    this.assertParticipant(row, currentUserId);

    if (row.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('Only pending requests can be accepted');
    }

    if (row.requestedBy === currentUserId) {
      throw new ForbiddenException('You cannot accept your own friend request');
    }

    row.status = FriendshipStatus.ACCEPTED;
    await this.friendRepo.save(row);
    const full = await this.loadWithRelations(row.id);
    return this.rowToDto(full!, currentUserId);
  }

  async reject(rowId: number, currentUserId: number): Promise<FriendshipRowDto> {
    const row = await this.loadWithRelations(rowId);
    if (!row) {
      throw new NotFoundException('Friend request not found');
    }

    this.assertParticipant(row, currentUserId);

    if (row.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    if (row.requestedBy === currentUserId) {
      throw new ForbiddenException('Use cancel to withdraw your own request');
    }

    row.status = FriendshipStatus.REJECTED;
    await this.friendRepo.save(row);
    const full = await this.loadWithRelations(row.id);
    return this.rowToDto(full!, currentUserId);
  }

  async removeOrCancel(rowId: number, currentUserId: number): Promise<void> {
    const row = await this.friendRepo.findOne({
      where: { id: rowId },
      relations: ['user', 'friend'],
    });
    if (!row) {
      throw new NotFoundException('Friendship not found');
    }

    this.assertParticipant(row, currentUserId);

    if (row.status === FriendshipStatus.ACCEPTED) {
      await this.friendRepo.remove(row);
      return;
    }

    if (row.status === FriendshipStatus.PENDING) {
      if (row.requestedBy !== currentUserId) {
        throw new ForbiddenException(
          'Only the requester can cancel a pending request; use reject for incoming requests',
        );
      }
      await this.friendRepo.remove(row);
      return;
    }

    if (row.status === FriendshipStatus.REJECTED) {
      await this.friendRepo.remove(row);
      return;
    }

    throw new ConflictException('Nothing to remove for this friendship state');
  }

  async listAcceptedFriends(userId: number): Promise<FriendshipRowDto[]> {
    const rows = await this.friendRepo
      .createQueryBuilder('uf')
      .leftJoinAndSelect('uf.user', 'u')
      .leftJoinAndSelect('u.userRelatedData', 'urd')
      .leftJoinAndSelect('uf.friend', 'f')
      .leftJoinAndSelect('f.userRelatedData', 'frd')
      .where('uf.status = :st', { st: FriendshipStatus.ACCEPTED })
      .andWhere('(u.id = :uid OR f.id = :uid)', { uid: userId })
      .orderBy('uf.createdAt', 'ASC')
      .getMany();

    return rows.map((r) => this.rowToDto(r, userId));
  }

  async listPending(userId: number): Promise<PendingFriendshipsDto> {
    const rows = await this.friendRepo
      .createQueryBuilder('uf')
      .leftJoinAndSelect('uf.user', 'u')
      .leftJoinAndSelect('u.userRelatedData', 'urd')
      .leftJoinAndSelect('uf.friend', 'f')
      .leftJoinAndSelect('f.userRelatedData', 'frd')
      .where('uf.status = :st', { st: FriendshipStatus.PENDING })
      .andWhere('(u.id = :uid OR f.id = :uid)', { uid: userId })
      .orderBy('uf.createdAt', 'DESC')
      .getMany();

    const incoming: FriendshipRowDto[] = [];
    const outgoing: FriendshipRowDto[] = [];

    for (const r of rows) {
      const dto = this.rowToDto(r, userId);
      if (r.requestedBy === userId) {
        outgoing.push(dto);
      } else {
        incoming.push(dto);
      }
    }

    return { incoming, outgoing };
  }
}
