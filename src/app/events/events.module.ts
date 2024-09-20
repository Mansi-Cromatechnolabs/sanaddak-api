import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { APP_GUARD } from '@nestjs/core';
import { WsAuthGuard } from './guard/socket.auth.guard';


@Module({
  providers: [
    EventsGateway
   ],
})
export class EventsModule {}
