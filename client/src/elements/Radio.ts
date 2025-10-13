import { defaultFont } from '../main';

export class Radio {
  private chat: { date: Date; message: string }[] = [];
  private messageElementsConfig = [
    { offsetY: 942, alpha: 1 },
    { offsetY: 910, alpha: 1 },
    { offsetY: 878, alpha: 0.7 },
    { offsetY: 846, alpha: 0.6 },
    { offsetY: 814, alpha: 0.5 },
  ];
  private messageElements: Phaser.GameObjects.Text[] = [];

  /** updates the text elements with messages from the chat list */
  private updateRadio() {
    for (let i = 0; i < this.messageElementsConfig.length; i++) {
      const c = this.chat[this.chat.length - 1 - i];
      if (this.messageElements[i] && c) {
        const h = c.date.getHours();
        const m = c.date.getMinutes();
        this.messageElements[i].text = '[' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + '] ' + c.message;
      }
    }
  }

  constructor() {
    this.sendMessage('Radio initialized');
  }

  /** adds a message to the chat list */
  sendMessage(message: string) {
    this.chat.push({ date: new Date(), message: message });
    this.updateRadio();
  }

  /** adds the text elements to the scene */
  initializeRadio(add: Phaser.GameObjects.GameObjectFactory) {
    add.image(140, 905, 'radio').setOrigin(0);
    this.messageElements = [];
    this.messageElementsConfig.forEach((e) => {
      this.messageElements.push(add.text(200, e.offsetY, '', defaultFont).setOrigin(0).setAlpha(e.alpha));
    });
    this.updateRadio();
  }
}
