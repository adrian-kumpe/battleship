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
import { AVAILABLE_SHIPS, BOARD_SIZE, MARKER_ROLE } from '../config';
import { Socket } from 'socket.io-client';
import { Radio } from './Radio';

/** manages battleship gameplay */
export class GameManager {
  /** the phase of the game (inspired by Phaser scenes) */
  private phase: 'MainMenu' | 'GameSetup' | 'GameReady' | 'Game' | 'GameOver' = 'MainMenu';
  /** the currently recognized shipPlacement */
  private currentShipPlacement?: ShipPlacement;
  /** whether the player needs respond after the opponent's attack; lock! */
  private needToRespondToAttack = false;
  /** currently recognized markers of the left grid */
  private currentLeftGridMarkers: (MARKER_ROLE | undefined)[] = [];
  /** whether the player needs to mark his own attack */
  private needToMarkAfterOwnAttack = false;
  /** currently recognized markers of the right grid */
  private currentRightGridMarkers: (MARKER_ROLE | undefined)[] = [];
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
      this.needToRespondToAttack = !ownAttack;
      this.needToMarkAfterOwnAttack = ownAttack;
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

  /** whether markers of the left grid need to be validated (after opponent's attack) */
  shouldUpdateLeftGridMarkers(): boolean {
    return this.needToRespondToAttack;
  }

  /** update left grid markers; handle new marker */
  updateLeftGridMarkers(placement: (MARKER_ROLE | undefined)[]) {
    console.log('new left grid marker', placement);
    const diff = this.diffFlatMarkerPlacement(placement, this.currentLeftGridMarkers);
    console.log('diff', diff);
    diff.flatMap((p, i) => {
      console.log('als coord', this.flatMarkerPlacementToCoordinate(i));
      return p ? i : [];
    });
    // todo
    this.currentLeftGridMarkers = placement;
  }

  /** whether markers of the right grid need to be validated (after own attack) */
  shouldUpdateRightGridMarkers(): boolean {
    return this.needToMarkAfterOwnAttack;
  }

  /** update right grid markers; handle new marker */
  updateRightGridMarkers(placement: (MARKER_ROLE | undefined)[]) {
    console.log('new right grid marker', placement);
    const diff = this.diffFlatMarkerPlacement(placement, this.currentRightGridMarkers);
    console.log('diff', diff);
    diff.flatMap((p, i) => {
      console.log('als coord', this.flatMarkerPlacementToCoordinate(i));
      return p ? i : [];
    });
    // todo diffFlatMarkerPlacement
    this.currentRightGridMarkers = placement;
  }

  private diffFlatMarkerPlacement(p1: (MARKER_ROLE | undefined)[], p2: (MARKER_ROLE | undefined)[]) {
    return p1.map((v1, i) => (v1 == p2[i] ? undefined : (v1 ?? p2[i])));
    // todo hier könnte ich auch gleich ein array aus Coord + Marker zurückgeben, das übrig geblieben ist
  }

  /** row major */
  private flatMarkerPlacementToCoordinate(i: number): Coord {
    // todo das funktioniert niemals
    return {
      x: i % BOARD_SIZE,
      y: Math.floor(i / BOARD_SIZE),
    };
  }

  /** handles the gameplay based on user input (gesture) */
  handleGesture(gestureName: string, pointerCoord?: Coord) {
    switch (this.phase) {
      default:
      case 'MainMenu':
        // todo implement room join
        break;
      case 'GameSetup':
        if (gestureName === 'thumbs_up') {
          this.confirmShipPlacement();
        }
        break;
      case 'GameReady':
        // nothing to see here
        break;
      case 'Game':
        if (gestureName === 'point' && pointerCoord) {
          this.confirmAttack(pointerCoord);
        }
        // setzen der marker --> respond mit thumbs up
        // wenn vorbei, dann gameover melden
        break;
      case 'GameOver':
        // hier passiert nichts mehr
        break;
    }
  }

  // handleGridMarker() {
  //   // switch (this.phase) {
  //   //   default:
  //   //   case 'MainMenu':
  //   //     break;
  //   // }
  //   // hier muss needToRespondToAttack auf false gesetzt werden, sobald der marker gesetzt wird
  //   // hier muss
  // }
}
