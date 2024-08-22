export enum PlayerNo {
  'PLAYER1',
  'PLAYER2',
}

export enum Modality {
  'POINT_AND_ClICK',
  'GESTURE',
  'VOICE',
  'KEYBOARD',
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

export interface ShipDefinition {
  readonly name: string;
  readonly size: number;
}

/** @constant */
export const shipDefinitions: ShipDefinition[] = [
  { size: 1, name: 'destroyer' },
  { size: 2, name: 'cruiser' },
  { size: 3, name: 'battleship' },
  { size: 4, name: 'aircraft carrier' },
];

export interface ShipInstance {
  readonly shipId: number;
  orientation: '↔️' | '↕️';
}

export interface Coord {
  x: number;
  y: number;
}

export type ShipConfig = (ShipDefinition & ShipInstance & Coord)[];

export interface AttackResult {
  hit: boolean;
  sunkenShip?: ShipDefinition & ShipInstance & Coord;
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
  attack: (args: AttackResult & { coord: Coord; playerNo: PlayerNo; modality: Modality }) => void;
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
  gameReady: (args: { shipConfig: ShipConfig }, cb: (error?: string) => void) => void;
  /**
   * places an attack
   * @param coord to attack
   * @param randomCoord flag defines whether a random coord should be used
   * @param snakeMovement flag defines the next coord relative to the last
   */
  attack: (
    args: { coord: Coord; randomCoord?: boolean; snakeMovement?: { up: number; right: number }; modality: Modality },
    cb: (error?: string) => void,
  ) => void;
  /**
   * attack placed by Alexa (voice control)
   * @param coord to attack
   */
  alexaAttack: (args: { roomId: string; playerNo: PlayerNo; coord: Coord }, cb: (error?: string) => void) => void;
  lock: (args: { locked: boolean }, cb: (error?: string) => void) => void;
}
