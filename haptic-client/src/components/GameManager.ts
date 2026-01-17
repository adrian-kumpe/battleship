import {
  ShipPlacement,
  PlayerNo,
  Coord,
  RoomConfig,
  ErrorCode,
  ErrorMessage,
  PlayerNames,
  AttackResult,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../shared/models';
import { AVAILABLE_SHIPS, BOARD_SIZE } from '../config';
import { Socket } from 'socket.io-client';
import { Radio } from './Radio';

/** manages battleship gameplay */
export class GameManager {
  /** the phase of the game (inspired by Phaser scenes) */
  private phase: 'MainMenu' | 'GameSetup' | 'GameReady' | 'Game' | 'GameOver' = 'MainMenu';
  /** the currently recognized shipPlacement */
  private currentShipPlacement?: ShipPlacement;
  /**  */
  // private currentOwnMarkerPlacement;
  /**  */
  // private currentOpponentMarkerPlacement;
  private roomConfig?: RoomConfig;
  private ownPlayerNo?: PlayerNo;
  private playerNames?: PlayerNames;

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
      this.playerNames = args.playerNames;
      this.radio.sendMessage(
        'All players ready, the game starts now. ' + this.playerNames[args.firstTurn] + ' begins!',
      );
      this.phase = 'Game';
    });

    this.socket.on('attack', (args) => {
      // angriff muss gesagt werden, damit reagiert werden kann; ausgeben dass reagiert werden muss
      const ownAttack = this.ownPlayerNo === args.playerNo;
      this.radio.sendMessage(
        (ownAttack ? 'You' : 'The opponent') + ' attacked cell ' + args.coord.x + ' ' + args.coord.y,
      );
    });

    this.socket.on('gameOver', (args) => {
      if (args.error) {
        console.warn(ErrorMessage[args.error]);
        this.radio.sendMessage('Error: ' + ErrorMessage[args.error]);
      }
      // winner: args.winner, todo
    });
  }

  /** easy implementation: just create a room todo */
  private beginMultiplayer() {
    this.socket.emit(
      'createRoom',
      { roomConfig: { boardSize: BOARD_SIZE, availableShips: AVAILABLE_SHIPS }, playerName: 'Haptic Player' },
      (args?: { roomConfig: RoomConfig }, error?: ErrorCode) => {
        if (args) {
          this.radio.sendMessage(`Successfully created room [${args.roomConfig.roomId}]`);
          this.roomConfig = args.roomConfig;
          this.ownPlayerNo = PlayerNo.PLAYER1;
          this.phase = 'GameSetup';
        }
        if (error) {
          console.warn(ErrorMessage[error]);
          this.radio.sendMessage('Error: ' + ErrorMessage[error]);
        }
      },
    );
  }

  private confirmShipPlacement() {
    if (this.currentShipPlacement) {
      this.socket.emit('gameReady', { shipPlacement: this.currentShipPlacement }, (error?: ErrorCode) => {
        if (error) {
          console.warn(ErrorMessage[error]);
          this.radio.sendMessage('Error: ' + ErrorMessage[error]);
        } else {
          //todo weiß man hier, ob das senden der placement funktioniert hat? evtl muss cb aufgerufen werden
          this.radio.sendMessage('You are ready!');
          this.phase = 'GameReady';
        }
      });
    }
  }

  private confirmAttack(coord: Coord) {
    this.socket.emit('attack', { coord: coord }, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Error: ' + ErrorMessage[error]);
      }
    });
  }

  private respondToAttack(attackResult: AttackResult) {
    this.socket.emit('respond', attackResult, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Error: ' + ErrorMessage[error]);
      }
    });
  }

  private respondToGameOver(winner: PlayerNo) {
    this.socket.emit('reportGameOver', { winner: winner }, (error?: ErrorCode) => {
      if (error) {
        console.warn(ErrorMessage[error]);
        this.radio.sendMessage('Error: ' + ErrorMessage[error]);
      }
    });
  }

  /** if shipPlacement is still needed */
  shouldUpdateShipPlacement(): boolean {
    return this.phase === 'GameSetup';
  }

  updateShipPlacement(placement: ShipPlacement) {
    this.currentShipPlacement = placement;
  }

  //update markerplacement

  /** handles the gameplay based on user input (gesture) */
  handleGesture(gestureName: string, pointerCoord?: Coord) {
    switch (this.phase) {
      default:
      case 'MainMenu':
        // hier später beitritt zu raum; wird übersprungen
        break;
      case 'GameSetup':
        // wenn thumbs up --> shiplacement bestätigen
        break;
      case 'GameReady':
        // wird nur vom server unterbrochen
        break;
      case 'Game':
        // point als attack senden
        // setzen der marker --> respond mit thumbs up
        // wenn vorbei, dann gameover melden
        break;
      case 'GameOver':
        // hier passiert nichts mehr
        break;
    }
  }
}
