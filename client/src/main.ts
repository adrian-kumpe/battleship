import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game/Game';
import { GameSetup as MainGameSetup } from './scenes/GameSetup/GameSetup';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Game, Types } from 'phaser';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, ReportMode } from './shared/models';
import { Radio } from './elements/Radio';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#028af8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preloader, MainGameSetup, MainMenu, MainGame, GameOver],
  disableContextMenu: true,
};

export default new Game(config);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:3000',
  // 'https://battleship-server-4725bfddd6bf.herokuapp.com',
  {
    transports: ['websocket'],
    query: {
      mode: 'autoReporting' as ReportMode,
    },
  },
);

export const gameRadio: Radio = new Radio();

socket.on('notification', (args) => {
  gameRadio.sendMessage(args.text);
});

export const defaultFont: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Arial Rounded MT',
  color: '#000000',
  fontSize: 24,
};

export const layoutConfig = {
  boardSize: 8,
  cellSize: 70,
  gridOffsetY: 250,
  leftGridOffsetX: 340,
  rightGridOffsetX: 1070,
};
