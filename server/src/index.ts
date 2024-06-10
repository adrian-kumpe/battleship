import {
  ClientToServerEvents,
  Coord,
  PlayerNo,
  RoomConfig,
  ServerToClientEvents,
  PartialShipConfig,
} from '@shared/models';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Room, RoomList } from './room';
import { BattleshipGameBoard } from './game';

export interface Client {
  socketId: string;
  clientName: string;
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
const roomList: RoomList = new RoomList();
const PORT = process.env.PORT || 3000;

io.engine.on('connection_error', (err) => {
  console.log(err.req); // the request object
  console.log(err.code); // the error code, for example 1
  console.log(err.message); // the error message, for example "Session ID unknown"
  console.log(err.context); // some additional error context
});

io.on('connection', (socket: Socket) => {
  console.info('Client connected', socket.id);

  /** adds new room to the roomList */
  socket.on('createRoom', (args: { roomConfig: Omit<RoomConfig, 'roomId'>; clientName: string }, cb) => {
    const client: Client = { socketId: socket.id, clientName: args.clientName };
    const newRoomId = roomList.getNewRoomId();
    const room = new Room(args.roomConfig, newRoomId, new BattleshipGameBoard(client));
    // const { error } = clientList.checkCreateRoom(client) ?? clientList.checkJoinRoom(client) ?? {};
    // if (error) return cb(error);
    roomList.addRoom(room);
    socket.join(newRoomId);
    console.info(`Room ${newRoomId} was created by ${args.clientName} ${socket.id}`);
    io.to(newRoomId).emit('notification', `${args.clientName} joined the game`);
    cb({ roomConfig: room.roomConfig });
  });

  /** adds client to an existing room of the roomList */
  socket.on('joinRoom', (args: { roomId: string; clientName: string }, cb) => {
    const client: Client = { socketId: socket.id, clientName: args.clientName };
    // const { error } = clientList.checkJoinRoom(client) ?? {};
    // if (error) return cb(error);
    const room = roomList.getRoom(args.roomId)!; // todo fehlerbehebung für !
    room.player2 = new BattleshipGameBoard(client);
    socket.join(args.roomId);
    console.info(`Client ${args.clientName} ${socket.id} joined Room ${args.roomId}`);
    io.to(args.roomId).emit('notification', `${args.clientName} joined the game`);
    cb({ roomConfig: room.roomConfig });
  });

  socket.on('disconnect', () => {});

  socket.on('gameReady', (args: { shipConfig: (PartialShipConfig & Coord)[] }, cb) => {
    // if (error) return cb(error);
    const room = roomList.getRoomBySocketId(socket.id)!; // todo fehlerbehebung !
    const { player } = room.getPlayerBySocketId(socket.id)!; // todo fehlerbehebung !
    player.shipConfig = args.shipConfig;
    if (room.getGameReady()) {
      console.info(`Room ${room.roomConfig.roomId} is ready to start`);
      io.to(room.roomConfig.roomId).emit('gameStart');
    }
  });

  socket.on('attack', (args: { coord: Coord }, cb) => {
    // if (error) return cb(error);
    const room = roomList.getRoomBySocketId(socket.id)!; // todo fehlerbehebung !
    const { player, playerNo } = room.getPlayerBySocketId(socket.id)!; // todo fehlerbehebung !
    const attackResult = player.placeAttack(args.coord);
    console.info(
      `Attack ${args.coord.x}-${args.coord.y} in room ${room.roomConfig.roomId} on player ${playerNo} was placed`,
    );
    io.to(room.roomConfig.roomId).emit(
      'attack',
      Object.assign(attackResult, { coord: args.coord, playerNo: playerNo }),
    );
    if (player.getGameOver()) {
      io.to(room.roomConfig.roomId).emit('gameOver', { winner: playerNo });
    }
  });

  socket.on('alexaAttack', (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb) => {
    console.log('alexaTestConnection wurde aufgerufen');
    cb();
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
