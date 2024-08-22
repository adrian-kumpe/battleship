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

  create(data: { winner: PlayerNo; playerConfig: PlayerConfig; ownPlayerNo: PlayerNo }) {
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2);
    this.camera = this.cameras.main;

    this.gameOverText = this.add
      .text(940, 445, 'Game Over', {
        ...defaultFont,
        fontSize: 74,
      })
      .setOrigin(0.5);

    const winner_text =
      data.winner === undefined
        ? 'The opponent left the game'
        : data.winner === data.ownPlayerNo
          ? 'You won the game'
          : data.playerConfig[data.winner] + ' won the game';

    gameRadio.drawRadio(this.add);
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
