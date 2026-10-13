import { Server as SocketServer, Socket } from 'socket.io';

interface ChatMessageData {
  meetingId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface RoomUser {
  socketId: string;
  userId: string;
  name: string;
}

const activeRooms = new Map<string, Map<string, RoomUser>>();

export const setupSocketHandlers = (io: SocketServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Connected: ${socket.id}`);

    // Room join/leave
    socket.on('join-room', ({ meetingId, userId, name }: { meetingId: string; userId: string; name?: string }) => {
      socket.join(meetingId);
      const participantName = name || 'Participant';
      console.log(`[Socket.io] User ${participantName} (${socket.id}) joined meeting: ${meetingId}`);

      if (!activeRooms.has(meetingId)) {
        activeRooms.set(meetingId, new Map());
      }
      const room = activeRooms.get(meetingId)!;

      // 1. Send all existing participants in this room to the joining user
      const existingUsers = Array.from(room.values());
      socket.emit('room-users', existingUsers);

      // 2. Add current user to room
      room.set(socket.id, { socketId: socket.id, userId, name: participantName });

      // 3. Broadcast to others in the room
      socket.to(meetingId).emit('user-joined', { userId, socketId: socket.id, name: participantName });
    });

    socket.on('leave-room', ({ meetingId, userId }: { meetingId: string; userId: string }) => {
      socket.leave(meetingId);
      console.log(`[Socket.io] User ${userId} left meeting: ${meetingId}`);
      const room = activeRooms.get(meetingId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) activeRooms.delete(meetingId);
      }
      socket.to(meetingId).emit('user-left', { userId, socketId: socket.id });
    });

    // WebRTC Signaling Events Contract
    socket.on('offer', ({ meetingId, offer, toSocketId, fromName }: { meetingId: string; offer: any; toSocketId: string; fromName?: string }) => {
      socket.to(toSocketId).emit('offer', { offer, fromSocketId: socket.id, fromName });
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
      for (const roomName of socket.rooms) {
        if (roomName !== socket.id) {
          const room = activeRooms.get(roomName);
          if (room) {
            room.delete(socket.id);
            if (room.size === 0) activeRooms.delete(roomName);
          }
          socket.to(roomName).emit('user-left', { socketId: socket.id });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Disconnected: ${socket.id}`);
    });
  });
};
