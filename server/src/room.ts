import { PlayerNo, RoomConfig } from '@shared/models';
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
}

export class Room {
  public roomConfig: RoomConfig;
  public player2?: BattleshipGameBoard;

  constructor(
    roomConfig: Omit<RoomConfig, 'roomId'>,
    newRoomId: string,
    public player1: BattleshipGameBoard,
  ) {
    this.roomConfig = Object.assign(roomConfig, { roomId: newRoomId });
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
}
