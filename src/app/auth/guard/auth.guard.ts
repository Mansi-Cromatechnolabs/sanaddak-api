import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import mongoose from 'mongoose';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { setTanantDbName } from 'src/utils/helper';
import { _401 } from 'src/utils/http-code.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    if (isPublic) {
      return true;
    }
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        status: _401,
        message: 'UnAuthorized',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY,
      });
      await setTanantDbName(payload.db_name);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException({
        status: _401,
        message: 'UnAuthorized',
      });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
