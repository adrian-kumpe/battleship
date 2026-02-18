import {
  ClientToServerEvents,
  Coord,
  ErrorCode,
  ErrorMessage,
  PlayerNo,
  ReportMode,
  RoomConfig,
  ServerToClientEvents,
  ShipPlacement,
} from './shared/models';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Room, RoomList } from './room';
import { BattleshipGameBoard } from './game';
import { BotPlayer, getBotShipPlacement } from './bot';

export interface Client {
  socketId: string;
  playerName: string;
  mode: ReportMode;
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
const botPlayers = new Map<string, BotPlayer>(); // roomId -> BotPlayer
const roomsWithBots = new Set<string>(); // Speichert roomIds, die einen Bot haben
const PORT = process.env.PORT || 3000;

io.engine.on('connection_error', (err) => {
  console.warn(err.req); // the request object
  console.warn(err.code); // the error code, for example 1
  console.warn(err.message); // the error message, for example "Session ID unknown"
  console.warn(err.context); // some additional error context
});

/**
 * Führt automatisch einen Bot-Angriff aus, wenn der Bot an der Reihe ist
 */
function performBotAttackIfNeeded(room: Room): void {
  // Prüfe ob der Bot überhaupt in diesem Raum ist
  const botPlayer = botPlayers.get(room.roomConfig.roomId);
  if (!botPlayer || !room.player2) {
    return;
  }

  // Prüfe ob der Bot an der Reihe ist (Bot ist immer Spieler 2)
  if (room.currentPlayer !== PlayerNo.PLAYER2) {
    return;
  }

  // Prüfe ob das Spiel überhaupt gestartet ist
  if (!room.getGameReady()) {
    return;
  }

  // Warte kurz, damit der Bot realistischer wirkt (1000ms)
  setTimeout(() => {
    // Hole die nächste Angriffs-Koordinate vom Bot
    const attackCoord = botPlayer.getNextAttackCoord();
    const attackedPlayer = room.player1; // Bot greift immer Spieler 1 an

    console.info(
      `[${room.roomConfig.roomId}] Computer greift Zelle ${String.fromCharCode(65 + attackCoord.x)}${attackCoord.y + 1} an.`,
    );

    // Berechne das Angriffsresultat
    const attackResult = attackedPlayer.placeAttack(attackCoord);

    // Aktualisiere Bot-Treffer
    if (attackResult.hit) {
      if (attackResult.sunken) {
        // Schiff versenkt - entferne alle Treffer dieses Schiffs
        botPlayer.removeHitsForSunkenShip(attackResult.sunken);
      } else {
        // Treffer, aber nicht versenkt - speichere Koordinate
        botPlayer.addHit(attackCoord);
      }
    }

    // Callback, der das Attack-Event sendet und den nächsten Zug vorbereitet
    const performAttackCallback = () => {
      // Sende Attack-Event an alle Clients
      io.to(room.roomConfig.roomId).emit(
        'attack',
        Object.assign(attackResult, { coord: attackCoord, playerNo: PlayerNo.PLAYER2 }),
      );

      // Prüfe ob Bot gewonnen hat
      if (attackedPlayer.getGameOver()) {
        console.info(`[${room.roomConfig.roomId}] Der Computer hat das Spiel gewonnen.`);
        const gameOverEvent = () => {
          io.to(room.roomConfig.roomId).emit('gameOver', { winner: PlayerNo.PLAYER2 });
          botPlayers.delete(room.roomConfig.roomId);
          roomsWithBots.delete(room.roomConfig.roomId);
        };
        if (attackedPlayer.client.mode === 'manualReporting') {
          room.gameOverLock.closeLock({ player: PlayerNo.PLAYER2 }, gameOverEvent);
        } else {
          gameOverEvent();
        }
        return;
      }

      // Spielerwechsel
      room.playerChange();

      // Rekursiv: wenn Bot wieder dran ist (sollte nicht passieren), erneut angreifen
      performBotAttackIfNeeded(room);
    };

    // Benachrichtigungen
    const text = `Computer greift Zelle ${String.fromCharCode(65 + attackCoord.x)}${attackCoord.y + 1} an.`;
    // io.to(attackedPlayer.client.socketId).emit('notification', { text: text });

    // Wenn Spieler 1 im manualReporting-Mode ist, warten auf Response
    if (attackedPlayer.client.mode === 'manualReporting') {
      const responseText = text + ' Reagiere!';
      io.to(attackedPlayer.client.socketId).emit('notification', { text: responseText });

      // Lock schließen - erwartet Response vom Spieler mit den KORREKTEN Werten
      room.responseLock.closeLock(
        {
          player: PlayerNo.PLAYER1,
          hit: attackResult.hit,
          sunken: !!attackResult.sunken,
        },
        performAttackCallback,
      );
    } else {
      // autoReporting - direkt ausführen
      performAttackCallback();
    }
  }, 1000);
}

io.on('connection', (socket: Socket) => {
  console.info('Client connected', socket.id);

  /** adds new room to the roomList */
  socket.on('createRoom', (args: { roomConfig: Omit<RoomConfig, 'roomId'>; playerName: string }, cb) => {
    const client: Client = {
      socketId: socket.id,
      playerName: args.playerName,
      mode: socket.handshake.query.mode as ReportMode,
    };
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
    io.to(newRoomId).emit('notification', { text: `${args.playerName} ist dem Spiel beigetreten` });

    cb({ roomConfig: room.roomConfig });
  });

  /** adds client to an existing room of the roomList */
  socket.on('joinRoom', (args: { roomId: string; playerName: string }, cb) => {
    const client: Client = {
      socketId: socket.id,
      playerName: args.playerName,
      mode: socket.handshake.query.mode as ReportMode,
    };
    const room = roomList.getRoom(args.roomId);
    const error = roomList.checkClientAlreadyInRoom(socket.id) ?? roomList.checkRoomIdUnknown(args.roomId); //todo noch schauen ob der raum voll ist
    if (error || !room) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(undefined, error ?? ErrorCode.INTERNAL_ERROR);
    }
    console.info(`[${args.roomId}] Client ${args.playerName} ${socket.id} joined the game`);
    room.player2 = new BattleshipGameBoard(client, room.roomConfig.boardSize);
    socket.join(args.roomId);
    io.to(args.roomId).emit('notification', { text: `${args.playerName} ist dem Spiel beigetreten` });
    cb({ roomConfig: room.roomConfig });
  });

  socket.on('disconnect', () => {
    console.info('Client disconnected', socket.id);
    // close room and end game for all players
    const room = roomList.getRoomBySocketId(socket.id);
    const { player, playerNo } = room?.getPlayerBySocketId(socket.id) ?? {};
    if (room && player && playerNo !== undefined) {
      console.info(`[${room.roomConfig.roomId}] Player ${playerNo} left the game`);
      io.to(room.roomConfig.roomId).emit('gameOver', { error: ErrorCode.PLAYER_DISCONNECTED });
      botPlayers.delete(room.roomConfig.roomId);
      roomsWithBots.delete(room.roomConfig.roomId);
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
    io.to(room.roomConfig.roomId).emit('notification', { text: `${player.client.playerName} ist bereit zum Starten` });
    player.shipPlacement = args.shipPlacement;

    // Füge Bot als Fallback hinzu, wenn noch niemand beigetreten ist
    if (!room.player2 && !roomsWithBots.has(room.roomConfig.roomId)) {
      console.info(`[${room.roomConfig.roomId}] No second player joined, adding bot as fallback`);
      const botClient: Client = {
        socketId: 'bot-' + room.roomConfig.roomId,
        playerName: 'Bot',
        mode: 'autoReporting',
      };
      room.player2 = new BattleshipGameBoard(botClient, room.roomConfig.boardSize);
      const botPlayer = new BotPlayer(room.player1, room.roomConfig.boardSize); // Bot greift player1 an
      botPlayers.set(room.roomConfig.roomId, botPlayer);
      roomsWithBots.add(room.roomConfig.roomId);

      // Bot-Schiffsplatzierung setzen (Standard-Konfiguration)
      try {
        const botShipPlacement = getBotShipPlacement();
        room.player2.shipPlacement = botShipPlacement;
        console.info(`[${room.roomConfig.roomId}] Bot joined the game and is ready`);
        io.to(room.roomConfig.roomId).emit('notification', { text: 'Bot ist dem Spiel beigetreten und bereit' });
      } catch (e) {
        console.error(`[${room.roomConfig.roomId}] Error setting bot ship placement:`, e);
      }
    }

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

      // Bot-Angriff starten, falls Bot beginnt
      performBotAttackIfNeeded(room);
    }
    cb();
  });

  /** player attacks */
  socket.on('attack', (args: { coord: Coord }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
    const attackedPlayer = room?.getPlayerByPlayerNo((((playerNo ?? 0) + 1) % 2) as PlayerNo);
    const error =
      room?.checkGameStarted() ??
      room?.responseLock.checkLocked() ??
      room?.gameOverLock.checkLocked() ??
      room?.checkCoordValid(args.coord) ??
      room?.checkPlayersTurn(playerNo) ??
      attackedPlayer?.checkCoordAvailable(args.coord);
    if (error || !room || playerNo === undefined || !attackedPlayer) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(error ?? ErrorCode.INTERNAL_ERROR);
    }
    const attackResult = attackedPlayer.placeAttack(args.coord);
    const attackResultEvent = () => {
      io.to(room.roomConfig.roomId).emit(
        'attack',
        Object.assign(attackResult, { coord: args.coord, playerNo: playerNo }),
      );
      if (attackedPlayer.getGameOver()) {
        console.info(`[${room.roomConfig.roomId}] Player ${playerNo} has won the game`);
        const gameOverEvent = () => {
          io.to(room.roomConfig.roomId).emit('gameOver', { winner: playerNo });
          botPlayers.delete(room.roomConfig.roomId);
          roomsWithBots.delete(room.roomConfig.roomId);
        };
        if (room.player1.client.mode === 'manualReporting' || room.player2?.client.mode === 'manualReporting') {
          room.gameOverLock.closeLock({ player: playerNo }, gameOverEvent);
        } else {
          gameOverEvent();
        }
      } else {
        // Wenn Spiel nicht vorbei ist, Bot-Angriff starten
        performBotAttackIfNeeded(room);
      }
    };

    let text = `${room.getPlayerByPlayerNo(playerNo)?.client.playerName} greift Zelle ${String.fromCharCode(65 + args.coord.x)}${args.coord.y + 1} an.`;
    console.info(`[${room.roomConfig.roomId}] ${text}`);
    io.to(socket.id).emit('notification', {
      text: text,
    });
    if (attackedPlayer.client.mode === 'manualReporting') {
      text += ' Reagiere!';
    }
    io.to(attackedPlayer.client.socketId).emit('notification', { text: text });
    room.playerChange();

    if (room.getPlayerByPlayerNo((((playerNo ?? 0) + 1) % 2) as PlayerNo)?.client.mode === 'manualReporting') {
      room.responseLock.closeLock(
        {
          player: (((playerNo ?? 0) + 1) % 2) as PlayerNo,
          hit: attackResult.hit,
          sunken: !!attackResult.sunken,
        },
        attackResultEvent,
      );
    } else {
      attackResultEvent();
    }
  });

  /** player responds to an attack */
  socket.on('respond', (args: { hit: boolean; sunken?: boolean }, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const error =
      room?.checkGameStarted() ?? (!room?.responseLock.checkLocked ? ErrorCode.RESPONSE_LOCK_OPEN : undefined); // todo dieser errorcode müsste schöner funktionieren; evtl das error attribut entfernen aus der lock klasse
    const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
    if (error || !room || playerNo === undefined) {
      console.warn(ErrorMessage[error ?? ErrorCode.INTERNAL_ERROR]);
      return cb(error ?? ErrorCode.INTERNAL_ERROR);
    }
    const released = room.responseLock.releaseLock({ player: playerNo, hit: args.hit, sunken: !!args.sunken }); // releaseLockCb --> emit attack
    if (!released) {
      return cb(ErrorCode.WRONG_RESPONSE);
    }
  });

  /** player (usually the winner) reports, that the game ended */
  socket.on('reportGameOver', (args: {}, cb) => {
    const room = roomList.getRoomBySocketId(socket.id);
    const playerNo = room?.getPlayerBySocketId(socket.id)?.playerNo;
    if (!room || playerNo === undefined) {
      console.warn(ErrorMessage[ErrorCode.INTERNAL_ERROR]);
      return cb(ErrorCode.INTERNAL_ERROR);
    }
    if (room.gameOverLock.releaseLock({ player: playerNo })) {
      botPlayers.delete(room.roomConfig.roomId);
      roomsWithBots.delete(room.roomConfig.roomId);
      roomList.deleteRoom(room.roomConfig.roomId);
      cb();
      // todo hier müsste danach das gameover event ausgelös werden
      // bzw der callback damit der raum geschlossen werden kann
    }
  });
});

httpServer.listen(PORT, () => console.info(`Server running on port ${PORT}`));
