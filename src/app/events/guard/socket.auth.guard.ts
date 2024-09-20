import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { setTanantDbName } from 'src/utils/helper';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      client.disconnect()
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY,
      });
      await setTanantDbName(payload.db_name);
      client['user'] = payload;
    } catch (e){
      client.disconnect()
      console.log(e.message);
      
      throw new WsException('Unauthorized');
    }
    return true;
  }

  private extractTokenFromSocket(client: any): string | undefined {
    // Extract token from headers or other metadata in WebSocket
    const token = client.handshake.headers.authorization;
    const [type, value] = token?.split(' ') ?? [];
    return type === 'Bearer' ? value : undefined;
  }
}
