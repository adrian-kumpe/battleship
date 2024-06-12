import { ClientToServerEvents, ServerToClientEvents } from '../shared/models';
import { io, Socket } from 'socket.io-client';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:3000',
  //'https://battleship-server-4725bfddd6bf.herokuapp.com',
  {
    transports: ['websocket'],
  },
);
