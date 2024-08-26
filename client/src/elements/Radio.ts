import { defaultFont } from '../main';

export class Radio {
  private chat: string[] = ['Radio initialized'];

  constructor(
    private firstLineElement?: Phaser.GameObjects.Text,
    private secondLineElement?: Phaser.GameObjects.Text,
  ) {}

  public sendMessage(text: string) {
    this.chat.push(text);
    this.updateElements();
  }

  public drawRadio(add: Phaser.GameObjects.GameObjectFactory) {
    add.image(140, 905, 'radio').setOrigin(0);
    this.secondLineElement = add
      .text(200, 910, '', defaultFont)
      // .setAlpha(0.2)
      .setOrigin(0);
    this.firstLineElement = add.text(200, 942, '', defaultFont).setOrigin(0);
    this.updateElements();
  }

  private updateElements() {
    if (this.firstLineElement && this.secondLineElement) {
      this.firstLineElement.text = this.chat[this.chat.length - 1];
      this.secondLineElement.text = this.chat[this.chat.length - 2];
    }
  }
}
