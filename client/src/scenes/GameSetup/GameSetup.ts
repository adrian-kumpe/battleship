import { Scene } from 'phaser';
import { cellSize, defaultFont, gameRadio, gridSize, socket } from '../../main';
import { Coord, PlayerNo, RoomConfig, ShipConfig, shipDefinitions } from '../../shared/models';
import { Grid } from '../../elements/Grid';
import { Ship, ShipArray } from '../../elements/Ship';
import { GestureCanvas, GestureRecognition } from '../../elements/Gestures';
import { InputLogic } from './InputLogic';
import { KeyboardInputLogic } from './KeyboardInputLogic';
import { PointerAndGestureInputLogic } from './PointerAndGestureInputLogic';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;
  offsetX = 200;
  additionalOffsetX = 420;
  offsetY = 250;

  placingGrid: Grid;
  gestureCanvas: GestureCanvas;
  private gestureRecognition: GestureRecognition;

  private baseShipId = 1;
  shipArray: ShipArray = new ShipArray();
  inputLogic: InputLogic;
  keyboardInputLogic: KeyboardInputLogic;
  pointerInputLogic: PointerAndGestureInputLogic;

  constructor() {
    super('GameSetup');

    this.placingGrid = new Grid({
      gridOffsetX: this.offsetX + this.additionalOffsetX,
      gridOffsetY: this.offsetY,
      cellSize: cellSize,
    });
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.input.setTopOnly(false); // todo das evtl global machen
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.roomConfig = args.roomConfig;
    this.ownPlayerNo = args.ownPlayerNo;

    this.placingGrid.drawGrid(this.add, '→');
    this.drawShipParking();
    this.drawButton();
    this.drawShips();
    gameRadio.drawRadio(this.add);

    socket.on('gameStart', (args) => {
      gameRadio.sendMessage('All players ready, the game starts now');
      this.scene.start('Game', {
        roomConfig: this.roomConfig,
        playerConfig: args.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
        shipConfig: this.getShipConfig(),
      });
    });

    this.inputLogic = new InputLogic(this);
    this.gestureRecognition = new GestureRecognition();
    this.pointerInputLogic = new PointerAndGestureInputLogic(
      this,
      this.inputLogic,
      this.shipArray,
      this.placingGrid,
      this.gestureRecognition,
      { x: this.offsetX, y: this.offsetY - cellSize },
      (gridSize + 7) * cellSize,
      (gridSize + 2) * cellSize,
    );
    this.inputLogic.registerExtension(this.pointerInputLogic);
    this.keyboardInputLogic = new KeyboardInputLogic(
      this,
      this.placingGrid,
      this.offsetX,
      this.offsetY,
      this.inputLogic,
      this.shipArray,
    );
    this.inputLogic.registerExtension(this.keyboardInputLogic);
  }

  private getShipId(): number {
    return this.baseShipId++;
  }

  private drawShipParking() {
    for (let i = 0; i < 7; i++) {
      for (let j = 1; j < 5; j++) {
        this.add
          .rectangle(this.offsetX + cellSize * j, this.offsetY + cellSize * i, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(4, 0xbbbbbb, 1);
      }
    }
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
        const shipConfig = this.getShipConfig();
        const error = this.checkShipConfigValid(shipConfig);
        if (error) {
          console.warn(error);
          gameRadio.sendMessage('Error: ' + error);
        } else {
          socket.emit('gameReady', { shipConfig: shipConfig }, (error?: string) => {
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          });
          // todo hier muss ersichtlich sein, dass die shipconfig abgeschickt wurde
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
        this.shipArray.push(draggableShip);
      });
  }

  private getShipConfig(): ShipConfig {
    return this.shipArray.map((v) => {
      return {
        ...v.getShipMetaInformation(),
        ...v.getCoord(),
      };
    });
  }

  private checkShipConfigValid(shipConfig: ShipConfig): string | undefined {
    const allCoords: (Coord & { guarded: boolean })[] = [];
    shipConfig.forEach((v) => {
      // push all coords where the ship is on or guards into allCoords
      const h = v.orientation === '↔️';
      for (let i = -1; i < 2; i++) {
        allCoords.push({ x: h ? v.x - 1 : v.x + i, y: h ? v.y + i : v.y - 1, guarded: true });
        for (let j = 0; j < v.size; j++) {
          allCoords.push({ x: h ? v.x + j : v.x + i, y: h ? v.y + i : v.y + j, guarded: i !== 0 });
        }
        allCoords.push({ x: h ? v.x + v.size : v.x + i, y: h ? v.y + i : v.y + v.size, guarded: true });
      }
    });
    const allShipsWithinGrid = allCoords.every((c) => {
      return c.guarded || (c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    });
    const shipCoords = allCoords.filter((c) => c.guarded === false);
    const noIllegalOverlaps = shipCoords.every((s) => allCoords.filter((a) => a.x === s.x && a.y === s.y).length <= 1);
    return !allShipsWithinGrid
      ? 'Not all ships are within the grid'
      : !noIllegalOverlaps
        ? 'There are illegal overlaps of some ships'
        : undefined;
  }
}
