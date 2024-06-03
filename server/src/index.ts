import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ClientList, RoomId } from './clients';

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  loginError: (error: string) => void;
}

export interface ClientToServerEvents {
  login: (args: { name: string; room: RoomId }) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  //   cors: {
  //     // origin: ['http://localhost:3000', 'https://battleship-server-4725bfddd6bf.herokuapp.com'],
  //     origin: ['http://localhost:3000'],
  //   },
});
const clientList: ClientList = new ClientList();
const PORT = process.env.PORT || 3000;

io.on('connection', (socket: Socket) => {
  console.log('Client connected', socket.id);

  socket.on('login', (args: { name: string; room: RoomId }) => {
    console.log('Client joined Room', args.room.id + args.room.player);
    const { error } =
      clientList.addClient({
        id: socket.id,
        name: args.name,
        room: args.room,
      }) ?? {};
    if (error) {
      socket.emit('loginError', error);
      return;
    }
    socket.join(args.room.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    const client = clientList.getClient(socket.id);
    if (client) {
      clientList.deleteClient(socket.id);
    }
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
