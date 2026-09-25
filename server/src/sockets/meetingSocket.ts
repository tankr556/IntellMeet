import { Server as SocketServer, Socket } from 'socket.io';

interface ChatMessageData {
  meetingId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const setupSocketHandlers = (io: SocketServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Connected: ${socket.id}`);

    // Room join/leave
    socket.on('join-room', ({ meetingId, userId }: { meetingId: string; userId: string }) => {
      socket.join(meetingId);
      console.log(`[Socket.io] User ${userId} (${socket.id}) joined meeting: ${meetingId}`);

      // Broadcast presence notification to others in room
      socket.to(meetingId).emit('user-joined', { userId, socketId: socket.id });
    });

    socket.on('leave-room', ({ meetingId, userId }: { meetingId: string; userId: string }) => {
      socket.leave(meetingId);
      console.log(`[Socket.io] User ${userId} left meeting: ${meetingId}`);
      socket.to(meetingId).emit('user-left', { userId, socketId: socket.id });
    });

    // WebRTC Signaling Events Contract
    socket.on('offer', ({ meetingId, offer, toSocketId }: { meetingId: string; offer: any; toSocketId: string }) => {
      socket.to(toSocketId).emit('offer', { offer, fromSocketId: socket.id });
    });

    socket.on('answer', ({ meetingId, answer, toSocketId }: { meetingId: string; answer: any; toSocketId: string }) => {
      socket.to(toSocketId).emit('answer', { answer, fromSocketId: socket.id });
    });

    socket.on('ice-candidate', ({ meetingId, candidate, toSocketId }: { meetingId: string; candidate: any; toSocketId: string }) => {
      socket.to(toSocketId).emit('ice-candidate', { candidate, fromSocketId: socket.id });
    });

    // In-Meeting Chat Scoped per Meeting Room
    socket.on('send-message', (data: ChatMessageData) => {
      console.log(`[Chat] Room ${data.meetingId} message from ${data.senderName}: ${data.text}`);
      io.to(data.meetingId).emit('new-message', data);
    });

    // Placeholders for real-time notifications
    socket.on('action-item-assigned', ({ meetingId, assigneeId, task }: { meetingId: string; assigneeId: string; task: string }) => {
      io.to(meetingId).emit('notification', {
        type: 'action-item-assigned',
        message: `Task assigned: ${task}`,
        assigneeId,
      });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', { socketId: socket.id });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Disconnected: ${socket.id}`);
    });
  });
};
