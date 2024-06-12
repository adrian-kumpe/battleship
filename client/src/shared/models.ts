export enum GameMode {
  '8X8' = 8,
}

export interface RoomConfig {
  mode: GameMode;
  roomId: string;
}

export interface Ship {
  name: string;
  size: number;
}

export const availableShips: (Ship & { count: number })[] = [
  // todo das müsse es geben entsprechend GameMode
  { size: 5, count: 0, name: 'aircraft-carrier' },
  { size: 4, count: 1, name: 'battleship' },
  { size: 3, count: 1, name: 'cruiser' },
  { size: 2, count: 1, name: 'destroyer' },
  { size: 1, count: 1, name: 'escort' },
];

export interface PartialShipConfig {
  ship: Ship;
  shipId: number;
  orientation: '↔️' | '↕️';
}

export interface Coord {
  x: number;
  y: number;
}

export enum PlayerNo {
  'PLAYER1',
  'PLAYER2',
}

export interface AttackResult {
  result: 'H' | 'M';
  sunkenShip?: Ship;
  // todo muss noch sinnvoll erweitert werden
}

export interface ServerToClientEvents {
  notification: (text: string) => void; // todo
  /** if both players have emitted gameReady the game can start */
  gameStart: (args: { first: PlayerNo }) => void;
  /** the game ends if a winner is determined */
  gameOver: (args: { winner: PlayerNo }) => void;
  attack: (args: AttackResult & { coord: Coord; playerNo: PlayerNo }) => void;
}

export interface ClientToServerEvents {
  /** create a game w/ settings */
  createRoom: (
    args: { roomConfig: Omit<RoomConfig, 'roomId'>; clientName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void, // vlt nur die roomid zurückschicken?
  ) => void;
  /** join a game */
  joinRoom: (
    args: { roomId: string; clientName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void,
  ) => void;
  /** commit shipConfig; if both players are ready server emits gameStart event */
  gameReady: (args: { shipConfig: (PartialShipConfig & Coord)[] }, cb: (error?: string) => void) => void;
  /** place an attack */
  attack: (args: { coord: Coord }, cb: (error?: string) => void) => void;
  alexaAttack: (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb: () => void) => void;
}

// todo bekommt man mitgeteilt, wie der andere Spieler heißt
// todo der client braucht eig nie die roomId
