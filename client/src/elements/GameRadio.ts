import { Scene } from 'phaser';
import { defaultFont } from '../main';

export class GameRadio {
  private chat: string[] = [];

  constructor(
    private firstLineElement?: Phaser.GameObjects.Text,
    private secondLineElement?: Phaser.GameObjects.Text,
  ) {}

  public sendMessage(text: string) {
    this.chat.push(text);
    this.updateElements();
  }

  public drawRadio(scene: Scene) {
    scene.add.image(140, 885, 'radio').setOrigin(0);
    this.secondLineElement = scene.add
      .text(
        200,
        890,
        '',
        Object.assign({}, defaultFont, {
          fontSize: 24,
        }),
      )
      // .setAlpha(0.2)
      .setOrigin(0);
    this.firstLineElement = scene.add
      .text(
        200,
        922,
        '',
        Object.assign({}, defaultFont, {
          fontSize: 24,
        }),
      )
      .setOrigin(0);
    this.updateElements();
  }

  private updateElements() {
    if (this.firstLineElement && this.secondLineElement) {
      this.firstLineElement.text = this.chat[this.chat.length - 1];
      this.secondLineElement.text = this.chat[this.chat.length - 2];
    }
  }
}
