import { Scene } from 'phaser';
import { PlayerConfig, PlayerNo } from '../shared/models';

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  titleText: Phaser.GameObjects.Text;
  gameOverText: Phaser.GameObjects.Text;

  constructor() {
    super('GameOver');
  }

  create(data: { winner: PlayerNo; playerConfig: PlayerConfig }) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff0000);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);

    this.gameOverText = this.add
      .text(500, 284, 'Game End', {
        fontFamily: 'Arial Black',
        fontSize: 64,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.gameOverText = this.add
      .text(510, 420, 'Player ' + (Number(data.winner) + 1).toString() + ' has won', {
        fontFamily: 'Arial Black',
        fontSize: 50,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.input.once('pointerdown', () => {
      this.changeScene();
    });
  }

  changeScene() {
    this.scene.start('MainMenu');
  }
}
