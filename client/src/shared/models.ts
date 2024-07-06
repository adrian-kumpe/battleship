export enum PlayerNo {
  'PLAYER1',
  'PLAYER2',
}

export interface RoomConfig {
  roomId: string;
  gameBoardSize: number;
  availableShips: number[];
}

/** playerName of both players; playerNo who starts the game */
export interface PlayerConfig {
  [PlayerNo.PLAYER1]: string;
  [PlayerNo.PLAYER2]: string;
  firstTurn: PlayerNo;
}

export interface Ship {
  name: string;
  size: number;
}

/** @constant */
export const shipDefinitions: Ship[] = [
  { size: 1, name: 'escort' },
  { size: 2, name: 'destroyer' },
  { size: 3, name: 'cruiser' },
  { size: 4, name: 'battleship' },
  // { size: 5, name: 'aircraft-carrier' },
];

export interface ShipMetaInformation {
  ship: Ship;
  shipId: number;
  orientation?: '↔️' | '↕️';
}

export interface Coord {
  x: number;
  y: number;
}

export interface AttackResult {
  hit: boolean;
  sunkenShip?: ShipMetaInformation & Coord;
}

/** server to client events {@link https://github.com/adrikum/battleship/wiki/Handling-client-server-events-along-with-game-scenes see documentation} */
export interface ServerToClientEvents {
  /**
   * sends a notification
   * @param text
   */
  notification: (args: { text: string }) => void;
  /**
   * starts the game when both players have emitted gameReady
   * @param playerConfig w/ all player names and firstTurn
   */
  gameStart: (args: { playerConfig: PlayerConfig }) => void;
  /**
   * ends the game; a winner might have been determined
   * @param winner
   */
  gameOver: (args: { winner?: PlayerNo }) => void;
  /**
   * informs all players when an attack was successfully placed
   * @param AttackResult w/ hit and sunkenShip information (if available)
   * @param coord that was attacked
   * @param playerNo who placed the attack
   */
  attack: (args: AttackResult & { coord: Coord; playerNo: PlayerNo }) => void;
}

/** client to server events {@link https://github.com/adrikum/battleship/wiki/Handling-client-server-events-along-with-game-scenes see documentation} */
export interface ClientToServerEvents {
  /** creates a game w/ desired settings
   * @param roomConfig desired config for the game
   * @param playerName
   * @returns completed roomConfig
   */
  createRoom: (
    args: { roomConfig: Omit<RoomConfig, 'roomId'>; playerName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void,
  ) => void;
  /**
   * joins a game
   * @param roomId id to join a room e.g. "1000"
   * @param playerName
   * @returns roomConfig
   */
  joinRoom: (
    args: { roomId: string; playerName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: string) => void,
  ) => void;
  /**
   * commits shipConfig; if both players are ready, the server can emit gameStart
   * @param shipConfig placement of the player's ships
   */
  gameReady: (args: { shipConfig: (ShipMetaInformation & Coord)[] }, cb: (error?: string) => void) => void;
  /**
   * places an attack
   * @param coord to attack
   */
  attack: (args: { coord: Coord }, cb: (error?: string) => void) => void;
  /**
   * attack placed by Alexa (voice control)
   * @param coord to attack
   */
  alexaAttack: (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb: (error?: string) => void) => void;
  lock: (args: { locked: boolean }, cb: (error?: string) => void) => void;
}
