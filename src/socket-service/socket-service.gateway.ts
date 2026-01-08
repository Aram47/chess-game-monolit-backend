import {
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  GameMakeMoveDto,
  SOCKET_SUBSCRIBE_MESSAGE,
} from '../../common';
import { SocketServiceService } from './socket-service.service';

@UseGuards(AuthGuard)
@WebSocketGateway({
  namespace: '/notifications',
  path: '/notification/socket.io',
  cors: {
    origin: '*', // will be changed to valid domains
  },
})
export class SocketServiceGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly socketServiceService: SocketServiceService) {}

  @SubscribeMessage(SOCKET_SUBSCRIBE_MESSAGE.FIND_GAME)
  async findGame(@ConnectedSocket() client: Socket) {
    await this.socketServiceService.findGame(
      this.server,
      client,
      client.data.user.sub, // sub is a user id
    );
  }

  @SubscribeMessage(SOCKET_SUBSCRIBE_MESSAGE.MAKE_MOVE)
  async makeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GameMakeMoveDto,
  ) {
    await this.socketServiceService.makeMove(this.server, client, payload);
  }
}
