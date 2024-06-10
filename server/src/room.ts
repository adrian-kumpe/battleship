import { PlayerNo, RoomConfig } from './models';
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

  public getClientAlreadyInRoom(socketId: string): string | undefined {
    return this.getRoomBySocketId(socketId) !== undefined ? 'Client is already in a room' : undefined;
  }

  public getRoomIdUnknown(roomId: string): string | undefined {
    return this.getRoom(roomId) === undefined ? 'Room does not exist' : undefined;
  }
}

export class Room {
  private currentPlayer: PlayerNo;
  public roomConfig: RoomConfig;
  public player2?: BattleshipGameBoard;

  constructor(
    roomConfig: Omit<RoomConfig, 'roomId'>,
    newRoomId: string,
    public player1: BattleshipGameBoard,
  ) {
    this.roomConfig = Object.assign(roomConfig, { roomId: newRoomId });
    this.currentPlayer = Math.random() < 0.5 ? PlayerNo.PLAYER1 : PlayerNo.PLAYER2;
    // todo muss man mitteilen, wer anfängt?
  }

  public getPlayerBySocketId(socketId: string): { player: BattleshipGameBoard; playerNo: PlayerNo } | undefined {
    return this.player1.client.socketId === socketId
      ? { player: this.player1, playerNo: PlayerNo.PLAYER1 }
      : this.player2?.client.socketId === socketId
        ? { player: this.player2, playerNo: PlayerNo.PLAYER2 }
        : undefined;
  }

  public getGameReady(): boolean {
    return this.player1.getPlayerReady() && !!this.player2?.getPlayerReady();
  }

  public getGameNotStartedYet(): string | undefined {
    return !this.getGameReady() ? 'Game has not started yet' : undefined;
  }

  public getIsPlayersTurn(playerNo?: PlayerNo): string | undefined {
    return this.currentPlayer !== playerNo ? "It's not the player's turn" : undefined;
  }

  public playerChange() {
    this.currentPlayer = ((this.currentPlayer + 1) % 2) as PlayerNo;
  }
}
