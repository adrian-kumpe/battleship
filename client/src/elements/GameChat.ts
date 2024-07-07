export class GameChat {
  constructor(
    private firstLine: Phaser.GameObjects.Text,
    private secondLine: Phaser.GameObjects.Text,
  ) {}

  public updateOutputElements(newFirstLine: Phaser.GameObjects.Text, newSecondLine: Phaser.GameObjects.Text) {
    const [old1Line, old2Line] = [this.firstLine.text, this.secondLine.text];
    this.firstLine = newFirstLine;
    this.secondLine = newSecondLine;
    this.firstLine.text = old1Line;
    this.secondLine.text = old2Line;
  }

  public sendMessage(text: string) {
    this.secondLine.text = this.firstLine.text;
    this.firstLine.text = text;
  }
}
