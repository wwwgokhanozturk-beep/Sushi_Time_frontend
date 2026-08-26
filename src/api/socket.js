import { io } from 'socket.io-client';
import { resolveSocketOrigin } from './apiBase';

const SOCKET_URL = resolveSocketOrigin();

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (!token) return null;
  if (socket?.connected && socket.auth?.token === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
