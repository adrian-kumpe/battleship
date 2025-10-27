import { Scene } from 'phaser';
import { defaultFont, gameRadio, layoutConfig, socket } from '../../main';
import { ErrorCode, ErrorMessage, GameData, GameSetupData, ShipPlacement, shipDefinitions } from '../../shared/models';
import { Grid } from '../../elements/Grid';
import { Ship, ShipArray } from '../../elements/Ship';
import { GestureCanvas, GestureRecognition } from '../../elements/Gestures';
import { InputLogic } from './InputLogic';
import { KeyboardInputLogic } from './KeyboardInputLogic';
import { PointerAndGestureInputLogic } from './PointerAndGestureInputLogic';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  private gameSetupData: GameSetupData;

  placingGrid: Grid;
  gestureCanvas: GestureCanvas;
  private gestureRecognition: GestureRecognition;
  private baseShipId: number;
  shipArray: ShipArray;
  inputLogic: InputLogic;
  keyboardInputLogic: KeyboardInputLogic;
  pointerAndGestureInputLogic: PointerAndGestureInputLogic;

  constructor() {
    super('GameSetup');

    this.placingGrid = new Grid({
      gridOffsetX: layoutConfig.rightGridOffsetX,
      gridOffsetY: layoutConfig.gridOffsetY,
      cellSize: layoutConfig.cellSize,
    });
  }

  create(data: GameSetupData) {
    this.input.setTopOnly(false);
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.gameSetupData = data;
    this.shipArray = new ShipArray();
    this.baseShipId = 1;

    this.placingGrid.drawGrid(this.add, '→');
    this.drawShipParking();
    this.drawButton();
    this.drawShips();
    this.drawInstructions();
    gameRadio.initializeRadio(this.add);

    socket.on('gameStart', (args) => {
      gameRadio.sendMessage('All players ready, the game starts now');
      this.scene.start('Game', {
        roomConfig: this.gameSetupData.roomConfig,
        playerNames: args.playerNames,
        playerNo: this.gameSetupData.playerNo,
        firstTurn: args.firstTurn,
        shipPlacement: this.getShipPlacement(),
      } satisfies GameData);
    });

    this.inputLogic = new InputLogic(this);
    this.gestureRecognition = new GestureRecognition();
    this.pointerAndGestureInputLogic = new PointerAndGestureInputLogic(
      this,
      this.inputLogic,
      this.shipArray,
      this.placingGrid,
      this.gestureRecognition,
      { x: layoutConfig.leftGridOffsetX, y: layoutConfig.gridOffsetY - layoutConfig.cellSize },
      (layoutConfig.boardSize + 7) * layoutConfig.cellSize,
      (layoutConfig.boardSize + 2) * layoutConfig.cellSize,
    );
    this.inputLogic.registerExtension(this.pointerAndGestureInputLogic);
    this.keyboardInputLogic = new KeyboardInputLogic(
      this,
      this.placingGrid,
      layoutConfig.leftGridOffsetX,
      layoutConfig.gridOffsetY,
      this.inputLogic,
      this.shipArray,
    );
    this.inputLogic.registerExtension(this.keyboardInputLogic);
  }

  /** get a fresh id */
  private getShipId(): number {
    return this.baseShipId++;
  }

  /**
   * @returns the placement as ShipPlacement
   */
  private getShipPlacement(): ShipPlacement {
    return this.shipArray.map((v) => {
      return {
        ...v.getShipMetaInformation(),
        ...v.getCoord(),
      };
    });
  }

  private drawShipParking() {
    for (let i = 0; i < 7; i++) {
      for (let j = 1; j < 5; j++) {
        this.add
          .rectangle(
            layoutConfig.leftGridOffsetX + layoutConfig.cellSize * j,
            layoutConfig.gridOffsetY + layoutConfig.cellSize * i,
            layoutConfig.cellSize,
            layoutConfig.cellSize,
          )
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
        const shipPlacement = this.getShipPlacement();
        socket.emit('gameReady', { shipPlacement: shipPlacement }, (error?: ErrorCode) => {
          if (error) {
            console.warn(ErrorMessage[error]);
            gameRadio.sendMessage('Error: ' + ErrorMessage[error]);
          }
          // todo hier muss ersichtlich sein, dass die shipplacement abgeschickt wurde
        });
      });
  }

  private drawShips() {
    this.gameSetupData.roomConfig.availableShips
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

  private drawInstructions() {
    return; // todo soll erstmal nicht angezeigt werden
    this.add.text(1300, layoutConfig.gridOffsetY, `Das ist nur ein Test`, defaultFont);
  }
}
