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
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2);
    this.camera = this.cameras.main;
    let winner_text = '';

    this.gameOverText = this.add
      .text(940, 404, 'Game End', {
        fontFamily: 'Arial Black',
        fontSize: 80,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100);

    if (data.winner === undefined) {
      winner_text = 'The opponent left the game';
    } else {
      winner_text = data.playerConfig[data.winner] + ' wins the game';
    }

    this.gameOverText = this.add
      .text(940, 620, winner_text, {
        fontFamily: 'Arial Black',
        fontSize: 70,
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
