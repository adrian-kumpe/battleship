import { Scene, GameObjects } from 'phaser';
import { defaultFont, gameRadio, socket } from '../main';
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

    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2);
    this.logo = this.add.image(980, 320, 'logo').setScale(0.67);

    this.add.image(770, 440, 'captain');

    this.title = this.add
      .text(1025, 445, 'Battleship', {
        ...defaultFont,
        fontSize: 74,
        align: 'center',
      })
      .setOrigin(0.5);

    this.room = this.add.text(1040, 600, 'Room Nr. ' + roomnr.toString(), {
      ...defaultFont,
      fontSize: 36,
    });

    const updownconfig = {
      ...defaultFont,
      fontSize: 20,
      backgroundColor: '#ffffff',
      padding: { x: 2, y: 2 },
      align: 'center',
      fixedHeight: 24,
      fixedWidth: 24,
    };

    this.upButton = this.add
      .text(1320, 605, '▲', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr += 1;
        this.room.setText('Room Nr. ' + roomnr.toString());
      });

    this.downButton = this.add
      .text(1320, 630, '▼', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr -= 1;
        this.room.setText('Room Nr. ' + roomnr.toString());
      });

    const buttonConfig = {
      ...defaultFont,
      fontSize: 36,
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: 360,
    };

    //todo gameboardsize entfernen
    this.newGameButton = this.add
      .text(775, 700, 'New Game', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'createRoom',
          { roomConfig: { gameBoardSize: 8, availableShips: [2, 2, 2, 1] }, playerName: 'Player1' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              gameRadio.sendMessage(`Successfully created room [${args.roomConfig.roomId}]`);
              this.scene.start('GameSetup', { roomConfig: args.roomConfig, ownPlayerNo: PlayerNo.PLAYER1 });
            }
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          },
        );
      });

    this.joinGameButton = this.add
      .text(1185, 700, 'Join Game', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'joinRoom',
          { roomId: roomnr.toString(), playerName: 'Player2' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              this.scene.start('GameSetup', { roomConfig: args.roomConfig, ownPlayerNo: PlayerNo.PLAYER2 });
            }
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          },
        );
      });

    gameRadio.drawRadio(this.add);
    gameRadio.sendMessage('Welcome to Battleship!');
  }
}
