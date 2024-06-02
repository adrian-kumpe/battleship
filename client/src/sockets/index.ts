import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@server/src/index'; // todo gute lsg zum sharen der beiden interfaces?

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  //   'http://localhost:3000',
  'https://battleship-server-4725bfddd6bf.herokuapp.com',
  {
    transports: ['websocket'],
  },
);
