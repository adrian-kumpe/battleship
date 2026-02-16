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
      // if (this.attackedCoord) {
      //   this.radio.sendMessage(
      //     'Du kannst noch den vergangenen Angriff markieren: ' + this.attackedCoord.x + ' ' + this.attackedCoord.y,
      //   );
      // } //todo bug
      this.attackedCoord = args.hit ? args.coord : undefined;
    });

    this.socket.on('gameOver', (args) => {
      if (args.error) {
        console.warn(ErrorMessage[args.error]);
        this.radio.sendMessage('Hinweis: ' + ErrorMessage[args.error]);
      }
      this.radio.sendMessage('Das Spiel ist vorbei! Spieler ' + args.winner + ' hat gewonnen!');
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
    // const getCurrent = () =>
    //   grid === '⬅️'
    //     ? { get: () => this.leftPinPlacement, set: (v: (MARKER_ROLE | undefined)[]) => (this.leftPinPlacement = v) }
    //     : { get: () => this.rightPinPlacement, set: (v: (MARKER_ROLE | undefined)[]) => (this.rightPinPlacement = v) };
    const current = grid === '⬅️' ? this.leftPinPlacement : this.rightPinPlacement;
    if (current) {
      // const diff = placement.map((m, i) => {
      //   return getCurrent().get()![i] === m ? undefined : (m ?? getCurrent().get()![i]);
      // });
      if (this.attackedCoord) {
        const attackedCoordIndex = this.attackedCoord.x * BOARD_SIZE + this.attackedCoord.y; // todo testen
        if (current[attackedCoordIndex]) {
          this.radio.sendMessage('Du hast die Zelle richtig markiert!');
          this.attackedCoord = undefined;
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
