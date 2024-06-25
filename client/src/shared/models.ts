export enum PlayerNo {
  'PLAYER1',
  'PLAYER2',
}

export interface RoomConfig {
  roomId: string;
  gameBoardSize: number;
  availableShips: number[];
}

/** clientName of players; playerNo who starts the game */
export interface PlayerConfig {
  [PlayerNo.PLAYER1]: string;
  [PlayerNo.PLAYER2]: string;
  firstTurn: PlayerNo;
}

export interface Ship {
  name: string;
  size: number;
}

export const shipDefinitions: Ship[] = [
  { size: 5, name: 'aircraft-carrier' },
  { size: 4, name: 'battleship' },
  { size: 3, name: 'cruiser' },
  { size: 2, name: 'destroyer' },
  { size: 1, name: 'escort' },
];

export interface ShipMetaInformation {
  ship: Ship;
  shipId: number;
  orientation: '↔️' | '↕️';
}

export interface Coord {
  x: number;
  y: number;
}

export interface AttackResult {
  hit: boolean;
  sunkenShip?: ShipMetaInformation & Coord;
}

export interface ServerToClientEvents {
  notification: (text: string) => void; // todo
  /** if both players have emitted gameReady the game can start */
  gameStart: (args: { playerConfig: PlayerConfig }) => void;
  /** the game ends if a winner is determined */
  gameOver: (args: { winner: PlayerNo }) => void;
  attack: (args: AttackResult & { coord: Coord; playerNo: PlayerNo }) => void;
}

export interface ClientToServerEvents {
  /** create a game w/ settings */
  createRoom: (
    args: { roomConfig: Omit<RoomConfig, 'roomId'>; clientName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void,
  ) => void;
  /** join a game */
  joinRoom: (
    args: { roomId: string; clientName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void,
  ) => void;
  /** commit shipConfig; if both players are ready server emits gameStart event */
  gameReady: (args: { shipConfig: (ShipMetaInformation & Coord)[] }, cb: (error?: string) => void) => void;
  /** place an attack */
  attack: (args: { coord: Coord }, cb: (error?: string) => void) => void;
  alexaAttack: (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb: () => void) => void;
}
