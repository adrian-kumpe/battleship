export class GameChat {
  private chat: string[] = [];

  constructor(
    private firstLineElement?: Phaser.GameObjects.Text,
    private secondLineElement?: Phaser.GameObjects.Text,
  ) {}

  public updateOutputElements(
    newFirstLineElement: Phaser.GameObjects.Text,
    newSecondLineElement: Phaser.GameObjects.Text,
  ) {
    this.firstLineElement = newFirstLineElement;
    this.secondLineElement = newSecondLineElement;
    this.updateElements();
  }

  public sendMessage(text: string) {
    this.chat.push(text);
    this.updateElements();
  }

  private updateElements() {
    if (this.firstLineElement && this.secondLineElement) {
      this.firstLineElement.text = this.chat[this.chat.length - 1];
      this.secondLineElement.text = this.chat[this.chat.length - 2];
    }
  }
}
