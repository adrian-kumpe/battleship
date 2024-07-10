import { Scene, GameObjects } from 'phaser';
import { gameRadio, socket } from '../main';
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
    this.logo = this.add.image(980, 300, 'logo');

    this.title = this.add
      .text(980, 500, 'Battleships\nMain Menu', {
        fontFamily: 'Arial Black',
        fontSize: 65,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    this.room = this.add.text(825, 650, 'Room Nr. ' + roomnr.toString(), {
      fontFamily: 'Arial Black',
      fontSize: 35,
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
      .text(1130, 652, '▲', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr += 1;
        this.room.setText('Room Nr. ' + roomnr.toString());
      });

    this.downButton = this.add
      .text(1130, 677, '▼', updownconfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        roomnr -= 1;
        this.room.setText('Room Nr. ' + roomnr.toString());
      });

    const buttonConfig = {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: 260,
    };

    this.newGameButton = this.add
      .text(830, 810, 'Start new Game', buttonConfig)
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
              gameRadio.sendMessage(`Created room [${args.roomConfig.roomId}]`);
            }
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          },
        );
      });

    this.joinGameButton = this.add
      .text(1130, 810, 'Join Game', buttonConfig)
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
              gameRadio.sendMessage(`Joined room [${args.roomConfig.roomId}]`);
            }
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          },
        );
      });

    gameRadio.drawRadio(this);
    gameRadio.sendMessage('Welcome to Battleship');
  }
}
