import { Scene } from 'phaser';
import { gameRadio, socket } from '../main';
import { Coord, PlayerNo, RoomConfig, ShipMetaInformation, shipDefinitions } from '../shared/models';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameOverText: Phaser.GameObjects.Text;

  gridSize: number;
  private baseShipId = 1000;
  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;

  constructor() {
    super('GameSetup');
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2);
    this.roomConfig = args.roomConfig;
    this.ownPlayerNo = args.ownPlayerNo;
    this.camera = this.cameras.main;

    this.gridSize = 8;

    socket.emit('gameReady', { shipConfig: this.placeShipsOnGridRandomly() }, (error?: string) => {
      if (error) {
        console.warn(error);
        gameRadio.sendMessage('Error: ' + error);
      }
    });

    gameRadio.drawRadio(this);

    socket.on('gameStart', (args) => {
      gameRadio.sendMessage('All players ready, the game starts now');
      this.scene.start('Game', {
        roomConfig: this.roomConfig,
        playerConfig: args.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
      });
    });
  }

  private getShipId(): number {
    return this.baseShipId++;
  }

  private placeShipsOnGridRandomly(): (ShipMetaInformation & Coord)[] {
    return [
      { ship: shipDefinitions[0], shipId: this.getShipId(), x: 0, y: 7 },
      { ship: shipDefinitions[0], shipId: this.getShipId(), x: 2, y: 7 },
      { ship: shipDefinitions[1], shipId: this.getShipId(), orientation: '↔️', x: 6, y: 7 },
      { ship: shipDefinitions[1], shipId: this.getShipId(), orientation: '↕️', x: 5, y: 4 },
      { ship: shipDefinitions[2], shipId: this.getShipId(), orientation: '↔️', x: 3, y: 0 },
      { ship: shipDefinitions[2], shipId: this.getShipId(), orientation: '↕️', x: 7, y: 3 },
      { ship: shipDefinitions[3], shipId: this.getShipId(), orientation: '↕️', x: 0, y: 0 },
    ];
  }
}
