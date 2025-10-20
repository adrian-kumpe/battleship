import {
  AttackResult,
  ClientToServerEvents,
  Coord,
  ErrorCode,
  ErrorMessage,
  PlayerNo,
  RoomConfig,
  ServerToClientEvents,
  ShipPlacement,
} from './shared/models';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Room, RoomList } from './room';
import { BattleshipGameBoard } from './game';

export interface Client {
  socketId: string;
  playerName: string;
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
  connectionStateRecovery: {},
});
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
  socket.on('createRoom', (args: { roomConfig: Omit<RoomConfig, 'roomId'>; playerName: string }, cb) => {
    const client: Client = { socketId: socket.id, playerName: args.playerName };
    const newRoomId = roomList.getNewRoomId();
    const room = new Room(args.roomConfig, newRoomId, new BattleshipGameBoard(client, args.roomConfig.boardSize));
    const error = roomList.checkClientAlreadyInRoom(socket.id);
    if (error) {
      console.warn(error);
      return cb(undefined, error);
    }
    console.info(`[${newRoomId}] was created by ${args.playerName} ${socket.id}`);
    roomList.addRoom(room);
    socket.join(newRoomId);
    io.to(newRoomId).emit('notification', { text: `${args.playerName} joined the game` });
    cb({ roomConfig: room.roomConfig });
  });

  /** adds client to an existing room of the roomList */
  socket.on('joinRoom', (args: { roomId: string; playerName: string }, cb) => {
    const client: Client = { socketId: socket.id, playerName: args.playerName };
    const room = roomList.getRoom(args.roomId);
    const error = roomList.checkClientAlreadyInRoom(socket.id) ?? roomList.checkRoomIdUnknown(args.roomId); //todo noch schauen ob der raum voll ist
    if (error || !room) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(undefined, error ?? ErrorCode.INTERNAL_ERROR);
    }
    console.info(`[${args.roomId}] Client ${args.playerName} ${socket.id} joined the game`);
    room.player2 = new BattleshipGameBoard(client, room.roomConfig.boardSize);
    socket.join(args.roomId);
    io.to(args.roomId).emit('notification', { text: `${args.playerName} joined the game` });
    cb({ roomConfig: room.roomConfig });
  });

  socket.on('disconnect', () => {
    console.info('Client disconnected', socket.id);
    // close room and end game for all players
    const room = roomList.getRoomBySocketId(socket.id);
    const { player, playerNo } = room?.getPlayerBySocketId(socket.id) ?? {};
    if (room && player && playerNo !== undefined) {
      console.info(`[${room.roomConfig.roomId}] Player ${playerNo} left the game, the room is closed`);
      io.to(room.roomConfig.roomId).emit('notification', { text: `${player.client.playerName} left the game` });
      io.to(room.roomConfig.roomId).emit('gameOver', {});
      roomList.deleteRoom(room.roomConfig.roomId);
    }
  });

  /** sets shipPlacement of player; if both players are ready start the game */
  socket.on('gameReady', (args: { shipPlacement: ShipPlacement }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const { player } = room?.getPlayerBySocketId(socket.id) ?? {};
    const error = room?.checkShipPlacementValid(args.shipPlacement);
    if (error || !room || !player) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(error ?? ErrorCode.INTERNAL_ERROR);
    }
    console.info(`[${room.roomConfig.roomId}] Client ${player.client.playerName} ${socket.id} ready to start`);
    io.to(room.roomConfig.roomId).emit('notification', { text: `${player.client.playerName} is ready to start` });
    player.shipPlacement = args.shipPlacement;
    if (room.getGameReady()) {
      console.info(`[${room.roomConfig.roomId}] All players are ready, the game starts now`);
      console.info(`[${room.roomConfig.roomId}] Player ${room.currentPlayer} begins`);
      io.to(room.roomConfig.roomId).emit('gameStart', {
        playerNames: {
          [PlayerNo.PLAYER1]: room.player1.client.playerName,
          [PlayerNo.PLAYER2]: room.player2!.client.playerName,
        },
        firstTurn: room.currentPlayer,
      });
    }
  });

  /** player attacks */
  socket.on('attack', (args: { coord: Coord }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
    const attackedPlayer = room?.getPlayerByPlayerNo((((playerNo ?? 0) + 1) % 2) as PlayerNo);
    const error =
      room?.checkGameStarted() ??
      room?.checkPlayersTurn(playerNo) ??
      room?.checkCoordValid(args.coord) ??
      room?.responseLock.checkLocked() ??
      room?.gameOverLock.checkLocked() ??
      attackedPlayer?.checkCoordAvailable(args.coord);
    if (error || !room || playerNo === undefined || !attackedPlayer) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(error ?? ErrorCode.INTERNAL_ERROR);
    }
    const attackResult = attackedPlayer.placeAttack(args.coord);
    room.responseLock.closeLock({ player: (((playerNo ?? 0) + 1) % 2) as PlayerNo, result: attackResult });
    room.playerChange();
    console.info(
      `[${room.roomConfig.roomId}] Player ${playerNo} attacked ${String.fromCharCode(65 + args.coord.x)}${args.coord.y + 1}`,
    );
    io.to(room.roomConfig.roomId).emit(
      'attack',
      Object.assign(attackResult, { coord: args.coord, playerNo: playerNo }),
    );
    if (attackedPlayer.getGameOver()) {
      console.info(`[${room.roomConfig.roomId}] Player ${playerNo} has won the game`);
      io.to(room.roomConfig.roomId).emit('gameOver', { winner: playerNo });
      room.gameOverLock.closeLock({ winner: playerNo });
      // roomList.deleteRoom(room.roomConfig.roomId); // todo deleteRoom wird eigentlich nicht gebraucht?
      // problem: spielen zwei phaser clients, dann müsste der raum hier gelöscht werden undd as lock nicht gesetzt
      // wenn das lock verwendet wird, dann darf der raum erst gelöscht werden, wenn reportGameOver ausgelöst wurde
    }
  });

  socket.on('respond', (args: AttackResult, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
    if (!room || playerNo === undefined) {
      console.warn(ErrorMessage[ErrorCode.INTERNAL_ERROR]);
      return cb(ErrorCode.INTERNAL_ERROR);
    }
    room.responseLock.releaseLock({ player: playerNo, result: args });
  });

  socket.on('reportGameOver', (args: { winner: PlayerNo }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    if (!room) {
      console.warn(ErrorMessage[ErrorCode.INTERNAL_ERROR]);
      return cb(ErrorCode.INTERNAL_ERROR);
    }
    room.gameOverLock.releaseLock(args);
  });
});

httpServer.listen(PORT, () => console.info(`Server running on port ${PORT}`));
