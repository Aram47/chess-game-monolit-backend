import {
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
export class SocketServiceGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly socketService: SocketServiceService) {}

  async handleDisconnect(client: Socket) {
    await this.socketService.handleDisconnect(this.server, client);
  }

  async handleConnection(client: Socket) {
    await this.socketService.handleReconnect(this.server, client);
  }

  @SubscribeMessage(SOCKET_SUBSCRIBE_MESSAGE.FIND_GAME)
  async findGame(@ConnectedSocket() client: Socket) {
    await this.socketService.findGame(
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
    await this.socketService.makeMove(this.server, client, payload);
  }
}
