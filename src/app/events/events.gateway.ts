import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsResponse,
  BaseWsExceptionFilter,
} from '@nestjs/websockets';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guard/socket.auth.guard';
import { connectedClients, notify } from './class/notification.class';

interface Appointment {
  store_id: string;
  customerId: string;
  appointmentDetails: any;
}
@WebSocketGateway({ cors: '*' })
@UseFilters(new BaseWsExceptionFilter())
@UseGuards(WsAuthGuard)
@Injectable()
export class EventsGateway {
  @SubscribeMessage('Connect')
  handleConnect(
    @MessageBody() token: string,
    @ConnectedSocket() client: any,
  ): void {
    const clientType = client.user.store_id ? 'staff' : 'customer';

    connectedClients.set(client.id, {
      socket: client,
      type: clientType,
      storeId: client.user.store_id,
    });

    console.log(
      `Client connected: ${client.id}, Type: ${clientType}, Store ID: ${client.user.store_id}`,
    );
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() client: Socket): void {
    connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('bookAppointment')
  async handleAppointmentBooking(
    @MessageBody() appointment: Appointment,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<any>> {
    notify.notifyClients(
      appointment.store_id,
      'Your appointment is booked',
      'A new appointment has been booked',
      appointment,
    );
    return { event: 'appointmentBooked', data: appointment };
  }

  @SubscribeMessage('goldRate')
  async handleGoldRate(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('configUpdate', {
      message: 'gold rate is updated',
      data: body,
    });
    return { event: 'notification', data: body };
  }
}
