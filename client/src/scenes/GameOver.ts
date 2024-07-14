import { Scene } from 'phaser';
import { PlayerConfig, PlayerNo } from '../shared/models';
import { defaultFont, gameRadio } from '../main';

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
      .text(940, 445, 'Game End', {
        ...defaultFont,
        fontSize: 74,
      })
      .setOrigin(0.5);

    if (data.winner === undefined) {
      winner_text = 'The opponent left the game';
    } else {
      winner_text = data.playerConfig[data.winner] + ' wins the game';
    }

    gameRadio.drawRadio(this);
    gameRadio.sendMessage(winner_text);

    this.gameOverText = this.add
      .text(940, 570, winner_text, {
        ...defaultFont,
        fontSize: 36,
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.changeScene();
    });
  }

  changeScene() {
    this.scene.start('MainMenu');
  }
}
