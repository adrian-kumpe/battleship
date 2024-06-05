import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ClientList, RoomId } from './clients';

export interface ServerToClientEvents {
  // noArg: () => void;
  // basicEmit: (a: number, b: string, c: Buffer) => void;
  // withAck: (d: string, callback: (e: number) => void) => void;
  notification: (text: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (args: { clientName: string; roomId: RoomId }, cb: (error?: string) => void) => void;
  joinRoom: (args: { clientName: string; roomId: RoomId }, cb: (error?: string) => void) => void;
  alexaTestConnection: (args: { test: string }, cb: () => void) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer);
const clientList: ClientList = new ClientList();
const PORT = process.env.PORT || 3000;

io.engine.on('connection_error', (err) => {
  console.log(err.req); // the request object
  console.log(err.code); // the error code, for example 1
  console.log(err.message); // the error message, for example "Session ID unknown"
  console.log(err.context); // some additional error context
});

io.on('connection', (socket: Socket) => {
  console.info('Client connected', socket.id);

  socket.on('alexaTestConnection', (args: { test: string }, cb) => {
    console.log('alexaTestConnection wurde aufgerufen');
    cb();
  });

  /** adds client w/ new room to the clientList */
  // todo spieleinformationen für den raum müssen gespeichert werden
  socket.on('createRoom', (args: { clientName: string; roomId: RoomId }, cb) => {
    const client = {
      id: socket.id,
      clientName: args.clientName,
      roomId: args.roomId,
    };
    const { error } = clientList.checkCreateRoom(client) ?? clientList.checkJoinRoom(client) ?? {};
    if (error) return cb(error);
    console.info(`Room ${args.roomId.id}${args.roomId.player} was created by ${args.clientName} ${socket.id}`);
    clientList.addClient(client);
    socket.join(args.roomId.id);
    io.to(args.roomId.id).emit('notification', `${args.clientName} joined the game`);
    cb();
  });

  /** adds client w/ existing room to the clientList */
  socket.on('joinRoom', (args: { clientName: string; roomId: RoomId }, cb) => {
    const client = {
      id: socket.id,
      clientName: args.clientName,
      roomId: args.roomId,
    };
    const { error } = clientList.checkJoinRoom(client) ?? {};
    if (error) return cb(error);
    console.info(`Client ${args.clientName} ${socket.id} joined Room ${args.roomId.id}${args.roomId.player}`);
    clientList.addClient(client);
    socket.join(args.roomId.id);
    io.to(args.roomId.id).emit('notification', `${args.clientName} joined the game`);
    cb();
  });

  /** removes client from the clientList */
  socket.on('disconnect', () => {
    const client = clientList.getClient(socket.id);
    if (client) {
      console.info(`Client ${client.clientName} ${socket.id} disconnected`);
      clientList.deleteClient(socket.id);
    } else {
      console.info(`${socket.id} disconnected`);
    }
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
