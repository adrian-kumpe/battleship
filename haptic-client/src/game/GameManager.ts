import { ShipPlacement, PlayerNo, Coord } from '../shared/models';
import { radio, socket } from '../main';

/** manages battleship gameplay */
export class GameManager {
  /** the phase of the game (inspired by Phaser scenes) */
  private phase: 'MainMenu' | 'GameSetup' | 'GameReady' | 'Game' | 'GameOver' = 'MainMenu';
  /** the currently recognized shipPlacement */
  private currentShipPlacement?: ShipPlacement;

  private playerNo: PlayerNo | null = null; // todo braucht man das

  constructor() {
    this.setupSocketListeners();
    this.beginMultiplayer();
  }

  /** register event sockets */
  private setupSocketListeners() {
    socket.on('gameStart', (args) => {
      radio.sendMessage('Das Spiel startet.');
      // ausgeben wer beginnt, sonst nichts machen
      this.phase = 'Game';
      this.playerNo = args.firstTurn === PlayerNo.PLAYER1 ? PlayerNo.PLAYER1 : PlayerNo.PLAYER2;
    });

    socket.on('attack', (args) => {
      // angriff muss gesagt werden, damit reagiert werden kann; ausgeben dass reagiert werden muss
      console.log('Opponent attacked:', args.coord);
    });

    socket.on('gameOver', (args) => {
      console.log('Game over');
      this.phase = 'GameOver';
    });
  }

  /** easy implementation: just create a room */
  private beginMultiplayer() {
    // todo
  }

  /** if shipPlacement is still needed */
  shouldUpdateShipPlacement(): boolean {
    return this.phase === 'GameSetup'; // und shipplacement noch nicht abgesendet; evtl phase ready
  }

  updateShipPlacement(placement: ShipPlacement) {
    this.currentShipPlacement = placement;
  }

  /** handles the gameplay when a gesture is detected */
  handleGesture(gestureName: string, pointerCoord?: Coord) {
    // wenn gamesetup und thumbs up --> dann shipplacement bestätigen
    // wenn bereits bestätigt, nichts machen (nur ausgabe)
    // wenn game, dann point als attack senden
    // wenn game, dann gameOver melden --> response senden
    // wenn game und thumbs up, dann marker validieren --> response senden an den server
  }
}
