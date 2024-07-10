import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image('background', 'assets/ocean.png');
  }

  create() {
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2);
    this.scene.start('Preloader');
  }
}
