import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameSetup as MainGameSetup } from './scenes/GameSetup';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Game, Types } from 'phaser';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './shared/models';

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
  scene: [Boot, Preloader, MainGameSetup, MainMenu, MainGame, GameOver],
};

export default new Game(config);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  // 'http://localhost:3000',
  'https://battleship-server-4725bfddd6bf.herokuapp.com',
  {
    transports: ['websocket'],
  },
);
