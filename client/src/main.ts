import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from 'phaser';
import { socket } from './sockets';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#028af8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

export default new Game(config);

console.log(socket);

socket.on('notification', (text) => {
  console.info(text);
});

socket.emit('createRoom', { clientName: 'Spieler 2', roomId: { id: 'foo', player: '2' } }, (error?: string) => {
  if (error) {
    console.warn(error);
  }
});
socket.emit('joinRoom', { clientName: 'Spieasdfler 2', roomId: { id: 'fasdfoo', player: '2' } }, (error?: string) => {
  console.log('hier müsste eine warnung stehen');
  if (error) {
    console.warn(error);
  }
});
