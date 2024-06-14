import { Scene } from 'phaser';
import { socket } from '../main';
import { Coord, PartialShipConfig, PlayerNo, RoomConfig } from '../shared/models';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameOverText: Phaser.GameObjects.Text;

  gridSize: number;
  private availableShips = [
    { name: 'aircraft-carrier', size: 5 },
    { name: 'battleship', size: 4 },
    { name: 'cruiser', size: 3 },
    { name: 'destroyer', size: 2 },
    { name: 'escort', size: 1 },
  ];
  private baseShipId = 1000;
  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;

  constructor() {
    super('GameSetup');

    socket.on('gameStart', (args) => {
      alert('Player Nr. ' + (args.first + 1) + ' starts');
      this.scene.start('Game', { roomConfig: this.roomConfig, ownPlayerNo: this.ownPlayerNo });
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

  private placeShipsOnGridRandomly(): (PartialShipConfig & Coord)[] {
    return [
      { ship: this.availableShips[0], shipId: this.getShipId(), orientation: '↕️', x: 0, y: 0 },
      { ship: this.availableShips[2], shipId: this.getShipId(), orientation: '↔️', x: 2, y: 0 },
      { ship: this.availableShips[3], shipId: this.getShipId(), orientation: '↕️', x: 3, y: 3 },
    ];
  }
}
