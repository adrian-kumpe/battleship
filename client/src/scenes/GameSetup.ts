import { Scene } from 'phaser';
import { defaultFont, gameRadio, gridSize, socket } from '../main';
import { Coord, PlayerNo, RoomConfig, ShipConfig, shipDefinitions } from '../shared/models';
import { Grid } from '../elements/Grid';
import { Ship } from '../elements/Ship';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  private baseShipId = 1;
  private shipConfig?: ShipConfig;
  private draggableShips: Ship[] = [];

  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;

  private placingGrid: Grid;

  constructor() {
    super('GameSetup');

    this.placingGrid = new Grid({
      gridOffsetX: 680,
      gridOffsetY: 250,
      cellSize: 70,
    });
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.roomConfig = args.roomConfig;
    this.ownPlayerNo = args.ownPlayerNo;

    this.placingGrid.drawGrid(this.add, '→');
    this.drawButton();
    this.drawShips();

    gameRadio.drawRadio(this.add);

    socket.on('gameStart', (args) => {
      gameRadio.sendMessage('All players ready, the game starts now');
      this.scene.start('Game', {
        roomConfig: this.roomConfig,
        playerConfig: args.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
        shipConfig: this.shipConfig!, // cant be undefined
      });
    });
  }

  private getShipId(): number {
    return this.baseShipId++;
  }

  private drawButton() {
    const buttonConfig = {
      ...defaultFont,
      fontSize: 36,
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: 360,
    };
    this.add
      .text(1485, 900, 'Ready', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.shipConfig = this.getShipConfig();
        if (this.getShipConfigValid()) {
          socket.emit('gameReady', { shipConfig: this.shipConfig }, (error?: string) => {
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          });
          // todo hier muss ersichtlich sein, dass die shipconfig abgeschickt wurde
        } else {
          const error = 'The arrangement of the ships is invalid';
          console.warn(error);
          gameRadio.sendMessage('Error: ' + error);
        }
      });
  }

  private drawShips() {
    this.roomConfig.availableShips
      .map((v: number, i: number) => {
        return Array.from(Array(v)).map((_) => i + 1);
      })
      .flat()
      .forEach((size: number, i: number) => {
        const draggableShip = new Ship(
          {
            ...shipDefinitions[size - 1],
            shipId: this.getShipId(),
            orientation: '↔️',
          },
          this.placingGrid.getCoordToGridCell.bind(this.placingGrid),
          this.placingGrid.getGridCellToCoord.bind(this.placingGrid),
          { x: i > 3 ? 0 : 5, y: (0 + 2 * i) % 8 },
        );
        draggableShip.drawShip(this);
        this.draggableShips.push(draggableShip);
      });
  }

  private getShipConfig(): ShipConfig {
    return this.draggableShips.map((v) => {
      return {
        ...v.getShipMetaInformation(),
        ...v.getCoord(),
      };
    });
  }

  private getShipConfigValid(): boolean {
    if (!this.shipConfig) {
      //todo das ist nicht optimal
      return false;
    }
    const allCoords: (Coord & { guarded: boolean })[] = [];
    this.shipConfig.forEach((v) => {
      // push all coords where the ship is on or guards into allCoords
      for (let i = -1; i < 2; i++) {
        allCoords.push({ x: v.x - 1, y: v.y + i, guarded: true });
        for (let j = 0; j < v.size; j++) {
          allCoords.push({ x: v.x + j, y: v.y + i, guarded: i !== 0 });
        }
        allCoords.push({ x: v.x + v.size, y: v.y + i, guarded: true });
      }
    });
    // todo es fehlen noch vertikale schiffe
    const allShipsWithinGrid = allCoords.every((c) => {
      return c.guarded || (c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    });
    const shipCoords = allCoords.filter((c) => c.guarded === false);
    const noIllegalOverlaps = shipCoords.every((s) => allCoords.filter((a) => a.x === s.x && a.y === s.y).length <= 1);
    return allShipsWithinGrid && noIllegalOverlaps;
  }
}
