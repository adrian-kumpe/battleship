import { Scene, GameObjects } from 'phaser';
import { socket } from '../sockets';
import { GameMode, RoomConfig } from '@shared/models';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;

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

    this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        //create
        socket.emit(
          'createRoom',
          { roomConfig: { mode: GameMode['8X8'] }, clientName: 'Spieler' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              console.log(args);
              this.scene.start('GameSetup', { roomConfig: args.roomConfig });
            }
            if (error) {
              console.log(error);
            }
          },
        );
      }
      if (pointer.rightButtonDown()) {
        //join
        socket.emit(
          'joinRoom',
          { roomId: '1000', clientName: 'Spieler2' },
          (args?: { roomConfig: RoomConfig }, error?: string) => {
            if (args) {
              console.log(args);
              this.scene.start('GameSetup', { roomConfig: args.roomConfig });
            }
            if (error) {
              console.log(error);
            }
          },
        );
      }
    });
  }
}
