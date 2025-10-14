export enum PlayerNo {
  'PLAYER1',
  'PLAYER2',
}
export interface PlayerNames {
  [PlayerNo.PLAYER1]: string;
  [PlayerNo.PLAYER2]: string;
}

/** Config for the two-player game room */
export interface RoomConfig {
  roomId: string;
  boardSize: number;
  availableShips: number[];
}

export interface ShipDefinition {
  readonly name: string;
  readonly size: number;
}

/**
 * definition of all available ships in the game
 * @constant
 */
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

/** list of ships placed on the game board */
export type ShipPlacement = (ShipDefinition & ShipInstance & Coord)[];

/** information if a ship was hit/sunken */
export interface AttackResult {
  hit: boolean;
  sunken?: ShipDefinition & ShipInstance & Coord;
}

/** error codes to use in client-server comunication */
export enum ErrorCode {
  /** generic internal error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** client is already in an other room */
  CLIENT_NOT_AVAILABLE = 'CLIENT_NOT_AVAILABLE',
  /** room w/ roomId wasnt found */
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  /** game hasn't started yet */
  GAME_HASNT_STARTED = 'GAME_HASNT_STARTED',
  /** it's not the player's turn */
  NOT_PLAYERS_TURN = 'NOT_PLAYERS_TURN',
  /** coord is not part of the grid */
  COORD_INVALID = 'COORD_INVALID',
  /** coord was already attacked */
  COORD_NOT_AVAILABLE = 'COORD_NOT_AVAILABLE',
  /** ship is not (fully) on the grid */
  SHIP_OUT_OF_GRID = 'SHIP_OUT_OF_GRID',
  /** there are ships w/ illegal overlaps */
  SHIP_WITH_ILLEGAL_OVERLAPS = 'SHIP_WITH_ILLEGAL_OVERLAPS',
}

/** textual description for error codes */
export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: 'Internal error',
  [ErrorCode.CLIENT_NOT_AVAILABLE]: 'Client is already in a room',
  [ErrorCode.ROOM_NOT_FOUND]: 'Room does not exist',
  [ErrorCode.GAME_HASNT_STARTED]: 'Game has not started yet',
  [ErrorCode.NOT_PLAYERS_TURN]: "It's not your turn",
  [ErrorCode.COORD_INVALID]: 'Coord is not valid',
  [ErrorCode.COORD_NOT_AVAILABLE]: 'Coord already attacked',
  [ErrorCode.SHIP_OUT_OF_GRID]: 'Not all ships are within the grid',
  [ErrorCode.SHIP_WITH_ILLEGAL_OVERLAPS]: 'There are illegal overlaps of some ships',
};

/** server to client events {@link https://github.com/adrikum/battleship/wiki/Handling-client-server-events-along-with-game-scenes see documentation} */
export interface ServerToClientEvents {
  /**
   * sends a notification
   * @param text
   */
  notification: (args: { text: string }) => void;
  /**
   * starts the game when both players have emitted gameReady
   * @param playerNames
   * @param firstTurn
   */
  gameStart: (args: { playerNames: PlayerNames; firstTurn: PlayerNo }) => void;
  /**
   * ends the game; a winner might have been determined
   * reaction to reportGameOver
   * @param winner
   */
  gameOver: (args: { winner?: PlayerNo }) => void;
  // todo das soll manuell gemacht werden --> event wird nur gesendet, nachdem das ende reported wurde
  /**
   * informs all players when an attack was successfully placed
   * @param AttackResult w/ information if a ship was hit/sunken (if available)
   * @param coord that was attacked
   * @param playerNo who placed the attack
   */
  attack: (args: AttackResult & { coord: Coord; playerNo: PlayerNo }) => void;
  // todo das soll manuell gemacht werden
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
    cb: (args?: { roomConfig: RoomConfig }, error?: ErrorCode) => void,
  ) => void;
  /**
   * joins a game
   * @param roomId id to join a room e.g. "1000"
   * @param playerName
   * @returns roomConfig
   */
  joinRoom: (
    args: { roomId: string; playerName: string },
    cb: (args?: { roomConfig: RoomConfig }, error?: ErrorCode) => void,
  ) => void;
  /**
   * commits shipPlacement; if both players are ready, the server can emit gameStart
   * @param shipPlacement placement of the player's ships
   */
  gameReady: (args: { shipPlacement: ShipPlacement }, cb: (error?: ErrorCode) => void) => void;
  /**
   * places an attack
   * @param coord to attack
   */
  attack: (args: { coord: Coord }, cb: (error?: ErrorCode) => void) => void;
  /**
   * player responds to an attack
   * @param AttackResult w/ information if a ship was hit/sunken (if available)
   * @param coord that was attacked
   */
  respond: (args: AttackResult & { coord: Coord }, cb: (error?: ErrorCode) => void) => void;
  /**
   * player flags a coord as (not) hit
   * @param coord to flag
   */
  flag: (args: Omit<AttackResult, 'sunken'> & { coord: Coord }, cb: (error?: ErrorCode) => void) => void;
  /**
   * player reports the end of the game
   */
  reportGameOver: (cb: (error?: ErrorCode) => void) => void;

  lock: (args: { locked: boolean }, cb: (error?: ErrorCode) => void) => void;
}

/** data needed to start GameSetup scene */
export interface GameSetupData {
  roomConfig: RoomConfig;
  /** the own player number */
  playerNo: PlayerNo;
}

/** data needed to start Game scene */
export interface GameData {
  roomConfig: RoomConfig;
  playerNames: PlayerNames;
  /** the own player number */
  playerNo: PlayerNo;
  /** player number of the starting player */
  firstTurn: PlayerNo;
  shipPlacement: ShipPlacement;
}

/** data needed to start GameSetup */
export interface GameOverData {
  /** the winner's player number */
  winner?: PlayerNo;
  playerNames: PlayerNames;
  /** the own player number */
  playerNo: PlayerNo;
}
