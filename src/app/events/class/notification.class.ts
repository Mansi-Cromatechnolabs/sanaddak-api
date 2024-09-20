import { Socket } from 'socket.io';
export const connectedClients = new Map<string, { socket: Socket; type: 'staff' | 'customer'; storeId?: string }>();
class Notifications {
    notifyClients(storeId: string, customerMessage: string, staffMessage: string, appointment: any) {
        const customerSockets = Array.from(connectedClients.values())
        .filter(entry => entry.type === 'customer' && entry.storeId === storeId)
        .map(entry => entry.socket);

        customerSockets.forEach(customerSocket => {
            customerSocket.emit('notification', {
                message: customerMessage,
                data: appointment,
            });
        });

        const staffSockets = Array.from(connectedClients.values())
            .filter(entry => entry.type === 'staff' && entry.storeId === storeId)
            .map(entry => entry.socket);

        staffSockets.forEach(staffSocket => {
            staffSocket.emit('notification', {
                message: staffMessage,
                data: appointment,
            });
        });
    }
}

export const notify = new Notifications(); 