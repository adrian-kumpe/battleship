import {
  ClientToServerEvents,
  Coord,
  PlayerNo,
  RoomConfig,
  ServerToClientEvents,
  PartialShipConfig,
} from './shared/models';
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
  console.warn(err.req); // the request object
  console.warn(err.code); // the error code, for example 1
  console.warn(err.message); // the error message, for example "Session ID unknown"
  console.warn(err.context); // some additional error context
});

io.on('connection', (socket: Socket) => {
  console.info('Client connected', socket.id);

  /** adds new room to the roomList */
  socket.on('createRoom', (args: { roomConfig: Omit<RoomConfig, 'roomId'>; clientName: string }, cb) => {
    const client: Client = { socketId: socket.id, clientName: args.clientName };
    const newRoomId = roomList.getNewRoomId();
    const room = new Room(args.roomConfig, newRoomId, new BattleshipGameBoard(client));
    const error = roomList.checkClientAlreadyInRoom(socket.id);
    if (error) {
      return cb(error);
    }
    console.info(`[${newRoomId}] was created by ${args.clientName} ${socket.id}`);
    roomList.addRoom(room);
    socket.join(newRoomId);
    io.to(newRoomId).emit('notification', `${args.clientName} joined the game`);
    cb({ roomConfig: room.roomConfig });
  });

  /** adds client to an existing room of the roomList */
  socket.on('joinRoom', (args: { roomId: string; clientName: string }, cb) => {
    const client: Client = { socketId: socket.id, clientName: args.clientName };
    const room = roomList.getRoom(args.roomId);
    const error = roomList.checkClientAlreadyInRoom(socket.id) ?? roomList.checkRoomIdUnknown(args.roomId);
    if (error || !room) {
      return cb(error ?? 'Internal error');
    }
    console.info(`[${args.roomId}] Client ${args.clientName} ${socket.id} joined the game`);
    room.player2 = new BattleshipGameBoard(client);
    socket.join(args.roomId);
    io.to(args.roomId).emit('notification', `${args.clientName} joined the game`);
    cb({ roomConfig: room.roomConfig });
  });

  socket.on('disconnect', () => {
    console.info('Client disconnected', socket.id);
  });

  /** sets shipConfig of player; if both players are ready start the game */
  socket.on('gameReady', (args: { shipConfig: (PartialShipConfig & Coord)[] }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const { player } = room?.getPlayerBySocketId(socket.id) ?? {};
    const error = undefined; // todo shipConfig müsste validiert werden
    if (error || !room || !player) {
      return cb(error ?? 'Internal error');
    }
    console.info(`[${room.roomConfig.roomId}] Client ${player.client.clientName} ${socket.id} ready to start`);
    player.shipConfig = args.shipConfig;
    if (room.getGameReady()) {
      console.info(`[${room.roomConfig.roomId}] All players are ready, the game starts now`);
      console.info(`[${room.roomConfig.roomId}] Player ${room.currentPlayer} begins`);
      io.to(room.roomConfig.roomId).emit('gameStart', { first: room.currentPlayer });
    }
  });

  const performAttack = (room: Room, player: BattleshipGameBoard, playerNo: PlayerNo, coord: Coord) => {
    const attackResult = player.placeAttack(coord);
    room.playerChange();
    console.info(
      `[${room.roomConfig.roomId}] Player ${playerNo} attacked ${String.fromCharCode(65 + coord.x)}${coord.y + 1}`,
    );
    io.to(room.roomConfig.roomId).emit('attack', Object.assign(attackResult, { coord: coord, playerNo: playerNo }));
    if (player.getGameOver()) {
      console.info(`[${room.roomConfig.roomId}] Player ${playerNo} has won the game`);
      io.to(room.roomConfig.roomId).emit('gameOver', { winner: playerNo }); // todo ist das richtig herum?
      roomList.deleteRoom(room.roomConfig.roomId);
    }
  };

  /** player attacks */
  socket.on('attack', (args: { coord: Coord }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const { player, playerNo } = room?.getPlayerBySocketId(socket.id) ?? {};
    const error =
      room?.checkGameStarted() ?? room?.checkPlayersTurn(playerNo) ?? player?.checkCoordAvailable(args.coord);
    if (error || !room || !player || playerNo === undefined) {
      return cb(error ?? 'Internal error');
    }
    performAttack(room, player, playerNo, args.coord);
  });

  /** player attacks using voice input */
  socket.on('alexaAttack', (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb) => {
    const room = roomList.getRoom(args.roomId);
    const player = room?.getPlayerByPlayerNo(args.playerNo);
    const error =
      room?.checkGameStarted() ?? room?.checkPlayersTurn(args.playerNo) ?? player?.checkCoordAvailable(args.coord);
    if (error || !room || !player) {
      // todo sinnvolle errors
      console.log(error ?? 'Internal error');
      return cb(); // Alexa can't receive error messages // todo test
    }
    console.info(`[${args.roomId}] Alexa connected`);
    performAttack(room, player, args.playerNo, args.coord);
    cb();
  });
});

httpServer.listen(PORT, () => console.info(`Server running on port ${PORT}`));
