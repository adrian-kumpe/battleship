import {
  ShipPlacement,
  PlayerNo,
  Coord,
  RoomConfig,
  ErrorCode,
  ErrorMessage,
  PlayerNames,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../shared/models';
import { AVAILABLE_SHIPS, BOARD_SIZE, MARKER_ROLE } from '../config';
import { Socket } from 'socket.io-client';
import { Radio } from './Radio';

/** manages battleship gameplay */
export class GameManager {
  /** the phase of the game (inspired by Phaser scenes) */
  private phase: 'MainMenu' | 'GameSetup' | 'GameReady' | 'Game' | 'GameOver' = 'MainMenu';
  /** the currently recognized shipPlacement */
  private currentShipPlacement?: ShipPlacement;
  private roomConfig?: RoomConfig;
  private ownPlayerNo?: PlayerNo;
  private playerNames?: PlayerNames;
  private leftPinPlacement?: (MARKER_ROLE | undefined)[];
  private rightPinPlacement?: (MARKER_ROLE | undefined)[];
  private attackedCoord?: Coord;
  private attackedCoord2?: Coord;

  constructor(
    private socket: Socket<ServerToClientEvents, ClientToServerEvents>,
    private radio: Radio,
  ) {
    this.setupSocketListeners();
    this.beginMultiplayer();
  }

  /** register event sockets */
  private setupSocketListeners() {
    this.socket.on('notification', (args) => {
      this.radio.sendMessage(args.text);
    });

    this.socket.on('gameStart', (args) => {
      this.phase = 'Game';
      this.playerNames = args.playerNames;
      this.radio.sendMessage(
        'Alle Spieler sind bereit, das Spiel startet. ' + this.playerNames[args.firstTurn] + ' beginnt!',
      );
    });

    this.socket.on('attack', (args) => {
      const ownAttack = this.ownPlayerNo === args.playerNo;
      this.radio.sendMessage(
        (args.sunken ? 'Versenkt!' : args.hit ? 'Getroffen!' : 'Daneben!') + (ownAttack ? '' : ' Du bist am Zug!'),
      );
      if (!ownAttack && this.attackedCoord) {
        this.radio.sendMessage(
          `Markiere deinen vergangenen Angriff: ${String.fromCharCode(65 + this.attackedCoord.x)}${this.attackedCoord.y + 1}`,
        );
        this.attackedCoord = undefined;
      }
      if (ownAttack && this.attackedCoord2) {
        this.radio.sendMessage(
          `Markiere den vergangenen Angriff des Computers: ${String.fromCharCode(65 + this.attackedCoord2.x)}${this.attackedCoord2.y + 1}`,
        );
        this.attackedCoord2 = undefined;
      }
      if (args.playerNo === PlayerNo.PLAYER1) {
        this.attackedCoord = args.hit ? args.coord : undefined;
      } else {
        this.attackedCoord2 = args.hit ? args.coord : undefined;
      }
    });

    this.socket.on('gameOver', (args) => {
      if (args.error) {
        console.warn(ErrorMessage[args.error]);
        this.radio.sendMessage('Hinweis: ' + ErrorMessage[args.error]);
      }
      if (this.playerNames && args.winner) {
        this.radio.sendMessage('Das Spiel ist vorbei! ' + this.playerNames[args.winner] + ' hat gewonnen!');
      }
    });
  }

  /** easy implementation: just create a room todo */
  private beginMultiplayer() {
    this.socket.emit(
      'createRoom',
      { roomConfig: { boardSize: BOARD_SIZE, availableShips: AVAILABLE_SHIPS }, playerName: 'Haptischer Spieler' },
      (args?: { roomConfig: RoomConfig }, error?: ErrorCode) => {
        if (args) {
          this.radio.sendMessage(`Raum erfolgreich erstellt [${args.roomConfig.roomId}]`);
          this.roomConfig = args.roomConfig;
          this.ownPlayerNo = PlayerNo.PLAYER1;
          this.phase = 'GameSetup';
        }
        if (error) {
          console.warn(ErrorMessage[error]);
          this.radio.sendMessage('Hinweis: ' + ErrorMessage[error]);
        }
      },
    );
  }

  confirmShipPlacement(forcedPlacement?: ShipPlacement) {
    const placement = forcedPlacement ?? this.currentShipPlacement;
    if (placement) {
      this.socket.emit('gameReady', { shipPlacement: placement }, (error?: ErrorCode) => {
        if (error) {
          console.warn(ErrorMessage[error]);
          this.radio.sendMessage('Hinweis: ' + ErrorMessage[error]);
        } else {
          this.phase = 'GameReady'; // todo bug: das wird aufgerufen, nachdem bereits auf Game umgestellt wurde
        }
      });
    }
  }

  confirmAttack(coord: Coord) {
    this.socket.emit('attack', { coord: coord }, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Hinweis: ' + ErrorMessage[error]);
      }
    });
  }

  respondToAttack(hit: boolean, sunken?: boolean) {
    this.socket.emit('respond', { hit: hit, sunken: sunken }, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Hinweis: ' + ErrorMessage[error]);
      }
    });
  }

  respondToGameOver() {
    this.socket.emit('reportGameOver', {}, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Hinweis: ' + ErrorMessage[error]);
      }
    });
  }

  /** if shipPlacement is still needed */
  shouldUpdateShipPlacement(): boolean {
    return this.phase === 'GameSetup';
  }

  updateShipPlacement(placement: ShipPlacement) {
    if (placement.length !== AVAILABLE_SHIPS.reduce((p, c) => p + c, 0)) {
      // placement has not the right amount of ships
      return;
    }
    this.currentShipPlacement = placement;
  }

  /** whether pins need to be validated (after own/opponent's attack) */
  shouldUpdatePins(): boolean {
    return this.phase !== 'MainMenu' && this.phase !== 'GameSetup';
  }

  updatePinPlacement(placement: (MARKER_ROLE | undefined)[], grid: '⬅️' | '➡️') {
    const current = grid === '⬅️' ? this.leftPinPlacement : this.rightPinPlacement;
    if (current) {
      if (this.attackedCoord) {
        const attackedCoordIndex = this.attackedCoord.y * BOARD_SIZE + this.attackedCoord.x;
        if (current[attackedCoordIndex]) {
          this.radio.sendMessage(
            `Zelle ${String.fromCharCode(65 + this.attackedCoord.x)}${this.attackedCoord.y + 1} richtig markiert!`,
          );
          this.attackedCoord = undefined;
        }
      }
      if (this.attackedCoord2) {
        const attackedCoord2Index = this.attackedCoord2.y * BOARD_SIZE + this.attackedCoord2.x;
        if (current[attackedCoord2Index]) {
          this.radio.sendMessage(
            `Zelle ${String.fromCharCode(65 + this.attackedCoord2.x)}${this.attackedCoord2.y + 1} richtig markiert!`,
          );
          this.attackedCoord2 = undefined;
        }
      }
    }

    if (grid === '⬅️') {
      this.leftPinPlacement = placement;
    } else {
      this.rightPinPlacement = placement;
    }
  }
}
