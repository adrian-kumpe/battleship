import { Scene, GameObjects } from 'phaser';
import { socket } from '../sockets';
import { GameMode, PlayerNo, RoomConfig } from '@shared/models';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  newGameButton: GameObjects.Text;
  joinGameButton: GameObjects.Text;

  constructor() {
    super('MainMenu');
  }

  create() {
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
      .text(362, 570, 'Neues Spiel starten', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'createRoom',
          { roomConfig: { mode: GameMode['8X8'] }, clientName: 'Spieler1' },
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
      .text(662, 570, 'Spiel beitreten', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit(
          'joinRoom',
          { roomId: '1000', clientName: 'Spieler2' },
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
