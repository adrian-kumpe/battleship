import { Coord, PlayerNo, RoomConfig } from './shared/models';
import { BattleshipGameBoard } from './game';

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

  public checkClientAlreadyInRoom(socketId: string): string | undefined {
    return this.getRoomBySocketId(socketId) !== undefined ? 'Client is already in a room' : undefined;
  }

  public checkRoomIdUnknown(roomId: string): string | undefined {
    return this.getRoom(roomId) !== undefined ? undefined : 'Room does not exist';
  }
}

export class Room {
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

  public checkGameStarted(): string | undefined {
    return this.getGameReady() ? undefined : 'Game has not started yet';
  }

  public checkPlayersTurn(playerNo?: PlayerNo): string | undefined {
    return this.currentPlayer !== playerNo ? "It's not the player's turn" : undefined;
  }

  public checkCoordValid(coord: Coord): string | undefined {
    return coord.x < 0 ||
      coord.y < 0 ||
      coord.x >= this.roomConfig.gameBoardSize ||
      coord.y >= this.roomConfig.gameBoardSize
      ? 'Coord is not valid'
      : undefined;
  }
}
