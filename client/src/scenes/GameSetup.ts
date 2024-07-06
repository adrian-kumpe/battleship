import { Scene } from 'phaser';
import { socket } from '../main';
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

    socket.on('gameStart', (args) => {
      alert('Player Nr. ' + (args.playerConfig.firstTurn + 1) + ' starts');
      this.scene.start('Game', {
        roomConfig: this.roomConfig,
        playerConfig: args.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
      });
    });
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.roomConfig = args.roomConfig;
    this.ownPlayerNo = args.ownPlayerNo;
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff4500);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);

    this.gridSize = 8;

    socket.emit('gameReady', { shipConfig: this.placeShipsOnGridRandomly() }, (error?: string) => {
      if (error) {
        console.log(error);
      }
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
