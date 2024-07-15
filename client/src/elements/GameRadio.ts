import { Scene } from 'phaser';
import { defaultFont } from '../main';

export class GameRadio {
  private chat: string[] = ['Radio initialized'];

  constructor(
    private firstLineElement?: Phaser.GameObjects.Text,
    private secondLineElement?: Phaser.GameObjects.Text,
  ) {}

  public sendMessage(text: string) {
    this.chat.push(text);
    this.updateElements();
  }

  public drawRadio(scene: Scene) {
    scene.add.image(140, 905, 'radio').setOrigin(0);
    this.secondLineElement = scene.add
      .text(200, 910, '', defaultFont)
      // .setAlpha(0.2)
      .setOrigin(0);
    this.firstLineElement = scene.add.text(200, 942, '', defaultFont).setOrigin(0);
    this.updateElements();
  }

  private updateElements() {
    if (this.firstLineElement && this.secondLineElement) {
      this.firstLineElement.text = this.chat[this.chat.length - 1];
      this.secondLineElement.text = this.chat[this.chat.length - 2];
    }
  }
}
