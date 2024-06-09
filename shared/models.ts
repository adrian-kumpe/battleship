export interface RoomId {
  id: string;
}

export enum GameMode {
  '5X5' = 5,
  '8X8' = 8,
}

export interface RoomConfig {
  mode: GameMode;
  roomId: RoomId;
}

export type ShipsConfig = {
  ship: { name: string; size: number };
  shipId: number;
  orientation?: '↔️' | '↕️';
  x: number;
  y: number;
}[];

export enum Player {
  'PLAYER1',
  'PLAYER2',
}

export interface ServerToClientEvents {
  notification: (text: string) => void; // todo
  /** if both players have emitted gameReady the game can start */
  gameStart: () => void;
  /** the game ends if a winner is determined */
  gameOver: (winner: string) => void; // todo
  attack: (args: { cell: string; player: Player; result: 'H' | 'M' }) => void;
}

export interface ClientToServerEvents {
  /** create a game w/ settings */
  createRoom: (args: { roomConfig: RoomConfig; clientName: string }, cb: (error?: string) => void) => void;
  /** join a game */
  joinRoom: (
    args: { roomId: RoomId; player: Player; clientName: string },
    cb: (args: { roomConfig: string }, error?: string) => void
  ) => void;
  /** commit shipConfig; if both players are ready server emits gameStart event */
  gameReady: (args: { shipConfig: string }, cb: (error?: string) => void) => void;
  /** place an attack */
  attack: (args: { cell: string }, cb: (error?: string) => void) => void; // todo
  alexaAttack: (args: { roomId: RoomId; player: Player; cell: string }, cb: () => void) => void; // todo
}
