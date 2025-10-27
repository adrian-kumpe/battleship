import { AttackResult, Coord, ErrorCode, PlayerNo, RoomConfig, ShipPlacement } from './shared/models';
import { BattleshipGameBoard } from './game';
import { Lock } from './lock';

export class RoomList {
  private rooms: Room[] = [];
  private newRoomId: number = 1000;

  public getNewRoomId(): string {
    return (this.newRoomId++).toString();
  }

  public addRoom(room: Room) {
    this.rooms.push(room);
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.find((r) => r.roomConfig.roomId === roomId);
  }

  public deleteRoom(roomId: string) {
    this.rooms.splice(
      this.rooms.findIndex((r) => r.roomConfig.roomId === roomId),
      1,
    );
  }

  public getRoomBySocketId(socketId: string): Room | undefined {
    return this.rooms.find((r) => r.player1.client.socketId === socketId || r.player2?.client.socketId === socketId);
  }

  public checkClientAlreadyInRoom(socketId: string): ErrorCode | undefined {
    return this.getRoomBySocketId(socketId) !== undefined ? ErrorCode.CLIENT_NOT_AVAILABLE : undefined;
  }

  public checkRoomIdUnknown(roomId: string): ErrorCode | undefined {
    return this.getRoom(roomId) !== undefined ? undefined : ErrorCode.ROOM_NOT_FOUND;
  }
}

export class Room {
  public responseLock: Lock<{ player: PlayerNo; result: AttackResult }>;
  public gameOverLock: Lock<{ winner: PlayerNo }>;
  public currentPlayer: PlayerNo;
  public roomConfig: RoomConfig;
  public player2?: BattleshipGameBoard;

  constructor(
    roomConfig: Omit<RoomConfig, 'roomId'>,
    newRoomId: string,
    public player1: BattleshipGameBoard,
  ) {
    this.roomConfig = Object.assign(roomConfig, { roomId: newRoomId });
    this.currentPlayer = Math.random() < 0.5 ? PlayerNo.PLAYER1 : PlayerNo.PLAYER2;
    this.responseLock = new Lock(
      (a, b) => a.player === b.player && a.result.hit === b.result.hit && a.result.sunken === b.result.sunken,
      ErrorCode.RESPONSE_LOCK_CLOSED,
    );
    this.gameOverLock = new Lock((a, b) => a.winner === b.winner, ErrorCode.GAME_OVER_LOCK_CLOSED);
  }

  public getPlayerBySocketId(socketId: string): { player: BattleshipGameBoard; playerNo: PlayerNo } | undefined {
    return this.player1.client.socketId === socketId
      ? { player: this.player1, playerNo: PlayerNo.PLAYER1 }
      : this.player2?.client.socketId === socketId
        ? { player: this.player2, playerNo: PlayerNo.PLAYER2 }
        : undefined;
  }

  public getPlayerByPlayerNo(playerNo: PlayerNo): BattleshipGameBoard | undefined {
    return playerNo === PlayerNo.PLAYER1 ? this.player1 : this.player2;
  }

  public getGameReady(): boolean {
    return this.player1.getPlayerReady() && !!this.player2?.getPlayerReady();
  }

  public playerChange() {
    this.currentPlayer = ((this.currentPlayer + 1) % 2) as PlayerNo;
  }

  public checkGameStarted(): ErrorCode | undefined {
    return this.getGameReady() ? undefined : ErrorCode.GAME_HASNT_STARTED;
  }

  public checkPlayersTurn(playerNo?: PlayerNo): ErrorCode | undefined {
    return this.currentPlayer !== playerNo ? ErrorCode.NOT_PLAYERS_TURN : undefined;
  }

  public checkCoordValid(coord: Coord): ErrorCode | undefined {
    return coord.x < 0 || coord.y < 0 || coord.x >= this.roomConfig.boardSize || coord.y >= this.roomConfig.boardSize
      ? ErrorCode.COORD_INVALID
      : undefined;
  }

  public checkShipPlacementValid(shipPlacement: ShipPlacement): ErrorCode | undefined {
    const allCoords: (Coord & { guarded: boolean })[] = [];
    shipPlacement.forEach((v) => {
      // push all coords where the ship is on or guards into allCoords
      const h = v.orientation === '↔️';
      for (let i = -1; i < 2; i++) {
        allCoords.push({ x: h ? v.x - 1 : v.x + i, y: h ? v.y + i : v.y - 1, guarded: true });
        for (let j = 0; j < v.size; j++) {
          allCoords.push({ x: h ? v.x + j : v.x + i, y: h ? v.y + i : v.y + j, guarded: i !== 0 });
        }
        allCoords.push({ x: h ? v.x + v.size : v.x + i, y: h ? v.y + i : v.y + v.size, guarded: true });
      }
    });
    const allShipsWithinGrid = allCoords.every((c) => {
      return c.guarded || (c.x >= 0 && c.x < this.roomConfig.boardSize && c.y >= 0 && c.y < this.roomConfig.boardSize);
    });
    const shipCoords = allCoords.filter((c) => c.guarded === false);
    const noIllegalOverlaps = shipCoords.every((s) => allCoords.filter((a) => a.x === s.x && a.y === s.y).length <= 1);
    if (!allShipsWithinGrid) {
      return ErrorCode.SHIP_OUT_OF_GRID;
    }
    if (!noIllegalOverlaps) {
      return ErrorCode.SHIP_WITH_ILLEGAL_OVERLAPS;
    }
  }
}
