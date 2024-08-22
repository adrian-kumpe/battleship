import {
  ClientToServerEvents,
  Coord,
  Modality,
  PlayerNo,
  RoomConfig,
  ServerToClientEvents,
  ShipConfig,
  ShipInstance,
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
let lock = false;

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
    const room = new Room(args.roomConfig, newRoomId, new BattleshipGameBoard(client, args.roomConfig.gameBoardSize));
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
    const error = roomList.checkClientAlreadyInRoom(socket.id) ?? roomList.checkRoomIdUnknown(args.roomId);
    if (error || !room) {
      console.warn(error ?? 'Internal error');
      return cb(undefined, error ?? 'Internal error');
    }
    console.info(`[${args.roomId}] Client ${args.playerName} ${socket.id} joined the game`);
    room.player2 = new BattleshipGameBoard(client, room.roomConfig.gameBoardSize);
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

  /** sets shipConfig of player; if both players are ready start the game */
  socket.on('gameReady', (args: { shipConfig: ShipConfig }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const { player } = room?.getPlayerBySocketId(socket.id) ?? {};
    const error = undefined; // todo shipConfig müsste validiert werden
    if (error || !room || !player) {
      console.warn(error ?? 'Internal error');
      return cb(error ?? 'Internal error');
    }
    console.info(`[${room.roomConfig.roomId}] Client ${player.client.playerName} ${socket.id} ready to start`);
    io.to(room.roomConfig.roomId).emit('notification', { text: `${player.client.playerName} is ready to start` });
    player.shipConfig = args.shipConfig;
    if (room.getGameReady()) {
      console.info(`[${room.roomConfig.roomId}] All players are ready, the game starts now`);
      console.info(`[${room.roomConfig.roomId}] Player ${room.currentPlayer} begins`);
      io.to(room.roomConfig.roomId).emit('gameStart', {
        playerConfig: {
          [PlayerNo.PLAYER1]: room.player1.client.playerName,
          [PlayerNo.PLAYER2]: room.player2!.client.playerName,
          firstTurn: room.currentPlayer,
        },
      });
    }
  });

  socket.on('lock', (args: { locked: boolean }, cb) => {
    lock = args.locked;
  });

  const performAttack = (
    room: Room,
    playerNo: PlayerNo,
    attackedPlayer: BattleshipGameBoard,
    coord: Coord,
    modality: Modality,
  ) => {
    const attackResult = attackedPlayer.placeAttack(coord);
    room.playerChange();
    console.info(
      `[${room.roomConfig.roomId}] Player ${playerNo} attacked ${String.fromCharCode(65 + coord.x)}${coord.y + 1}`,
    );
    io.to(room.roomConfig.roomId).emit(
      'attack',
      Object.assign(attackResult, { coord: coord, playerNo: playerNo, modality: modality }),
    );
    if (attackedPlayer.getGameOver()) {
      console.info(`[${room.roomConfig.roomId}] Player ${playerNo} has won the game`);
      io.to(room.roomConfig.roomId).emit('gameOver', { winner: playerNo });
      roomList.deleteRoom(room.roomConfig.roomId);
    }
  };

  /** player attacks */
  socket.on(
    'attack',
    (
      args: { coord: Coord; randomCoord?: boolean; snakeMovement?: { up: number; right: number }; modality: Modality },
      cb,
    ) => {
      const room = roomList.getRoomBySocketId(socket.id);
      const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
      const attackedPlayer = room?.getPlayerByPlayerNo((((playerNo ?? 0) + 1) % 2) as PlayerNo);
      const coord =
        (args.randomCoord
          ? attackedPlayer?.getRandomCoord()
          : args.snakeMovement
            ? attackedPlayer?.getNextCoord(args.snakeMovement)
            : undefined) ?? args.coord;
      const error =
        room?.checkGameStarted() ??
        room?.checkPlayersTurn(playerNo) ??
        room?.checkCoordValid(coord) ??
        attackedPlayer?.checkCoordAvailable(coord) ??
        checkLocked();
      if (error || !room || playerNo === undefined || !attackedPlayer) {
        console.warn(error ?? 'Internal error');
        return cb(error ?? 'Internal error');
      }
      performAttack(room, playerNo, attackedPlayer, coord, args.modality);
    },
  );

  /** player attacks using voice input */
  socket.on('alexaAttack', (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb) => {
    const room = roomList.getRoom(args.roomId);
    const attackedPlayer = room?.getPlayerByPlayerNo(((args.playerNo + 1) % 2) as PlayerNo);
    const error =
      room?.checkGameStarted() ??
      room?.checkPlayersTurn(args.playerNo) ??
      room?.checkCoordValid(args.coord) ??
      attackedPlayer?.checkCoordAvailable(args.coord) ??
      checkLocked();
    if (error || !room || !attackedPlayer) {
      console.warn(error ?? 'Internal error');
      return cb(error ?? 'Internal error');
    }
    console.info(`[${args.roomId}] Alexa connected`);
    performAttack(room, args.playerNo, attackedPlayer, args.coord, Modality.VOICE);
    cb();
  });
});

httpServer.listen(PORT, () => console.info(`Server running on port ${PORT}`));

function checkLocked(): string | undefined {
  return lock ? 'The gesture Input is currently being used' : undefined;
}
