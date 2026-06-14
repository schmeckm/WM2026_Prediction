import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket = null;
let displaySocket = null;
let presenceHeartbeatTimer = null;

const PRESENCE_HEARTBEAT_MS = 45_000;

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  presenceHeartbeatTimer = setInterval(() => {
    if (socket?.connected) {
      socket.emit('presence-heartbeat');
    }
  }, PRESENCE_HEARTBEAT_MS);
}

function stopPresenceHeartbeat() {
  if (presenceHeartbeatTimer) {
    clearInterval(presenceHeartbeatTimer);
    presenceHeartbeatTimer = null;
  }
}

export function connectSocket() {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated || socket?.connected) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  socket = io(url, {
    transports: ['websocket', 'polling'],
    auth: { token: authStore.token },
  });

  socket.on('connect', () => {
    if (authStore.user?.id) {
      socket.emit('join', authStore.user.id);
    }
    socket.emit('join-leaderboard');
    socket.emit('join-matches');
    socket.emit('presence-heartbeat');
    startPresenceHeartbeat();
  });

  socket.on('disconnect', () => {
    stopPresenceHeartbeat();
  });

  return socket;
}

export function connectDisplaySocket() {
  if (displaySocket?.connected) return displaySocket;

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  displaySocket = io(url, {
    transports: ['websocket', 'polling'],
  });

  displaySocket.on('connect', () => {
    displaySocket.emit('join-leaderboard');
    displaySocket.emit('join-matches');
  });

  return displaySocket;
}

export function disconnectSocket() {
  stopPresenceHeartbeat();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectDisplaySocket() {
  if (displaySocket) {
    displaySocket.disconnect();
    displaySocket = null;
  }
}

export function getSocket() {
  return socket;
}

export function onSocketEvent(event, callback) {
  if (!socket) connectSocket();
  socket?.on(event, callback);
  return () => socket?.off(event, callback);
}

export function onDisplaySocketEvent(event, callback) {
  if (!displaySocket) connectDisplaySocket();
  displaySocket?.on(event, callback);
  return () => displaySocket?.off(event, callback);
}
