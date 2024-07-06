import { Scene, GameObjects } from 'phaser';
import { socket } from '../main';
import { PlayerNo, RoomConfig } from '../shared/models';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  room: GameObjects.Text;
  newGameButton: GameObjects.Text;
  joinGameButton: GameObjects.Text;
  upButton: GameObjects.Text;
  downButton: GameObjects.Text;

  constructor() {
    super('MainMenu');
  }

  create() {
    let roomnr = 1000;

    this.background = this.add.image(512, 384, 'background');

    this.logo = this.add.image(512, 300, 'logo');

    this.title = this.add
      .text(512, 460, 'Main Menu', {
        fontFamily: 'Arial Black',
        fontSize: 38,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    this.room = this.add.text(380, 520, 'Raum Nr. ' + roomnr.toString(), {
      fontFamily: 'Arial Black',
      fontSize: 28,
      color: '#000000',
    });

    const updownconfig = {
      fontFamily: 'Arial Black',
      fontSize: 20,
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 0, y: 0 },
      align: 'center',
      fixedHeight: 20,
      fixedWidth: 20,
    };

    this.upButton = this.add
      .text(625, 522, '▲', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr += 1;
        this.room.setText('Raum Nr. ' + roomnr.toString());
      });

    this.downButton = this.add
      .text(625, 543, '▼', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr -= 1;
        this.room.setText('Raum Nr. ' + roomnr.toString());
      });

    const buttonConfig = {
      fontFamily: 'Arial Black',
      fontSize: 20,
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: 260,
    };

    this.newGameButton = this.add
      .text(362, 630, 'Neues Spiel starten', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'createRoom',
          { roomConfig: { gameBoardSize: 8, availableShips: [2, 2, 2, 1] }, playerName: 'Player1' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              console.log(args);
              this.scene.start('GameSetup', { roomConfig: args.roomConfig, ownPlayerNo: PlayerNo.PLAYER1 });
            }
            if (error) {
              console.log(error);
            }
          },
        );
      });

    this.joinGameButton = this.add
      .text(662, 630, 'Spiel beitreten', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'joinRoom',
          { roomId: roomnr.toString(), playerName: 'Player2' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              console.log(args);
              this.scene.start('GameSetup', { roomConfig: args.roomConfig, ownPlayerNo: PlayerNo.PLAYER2 });
            }
            if (error) {
              console.log(error);
            }
          },
        );
      });
  }
}
