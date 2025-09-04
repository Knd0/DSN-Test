import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token?.split(' ')[1]; // Bearer <token>

    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token); // Aquí podés usar el JWT Keycloak
      // Comprobar rol 'user'
      return payload?.realm_access?.roles?.includes('user');
    } catch (err) {
      return false;
    }
  }
}
