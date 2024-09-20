import { Scene } from 'phaser';
import { Grid } from '../../elements/Grid';
import { Modality, PlayerConfig, PlayerNo, RoomConfig, ShipConfig } from '../../shared/models';
import { socket, gameRadio, defaultFont, cellSize, gridSize } from '../../main';
import { Ship } from '../../elements/Ship';
import { KeyboardInputLogic } from './KeyboardInputLogic';
import { InputLogic } from './InputLogic';
import { PointerAndGestureInputLogic } from './PointerAndGestureInputLogic';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  private ownGrid: Grid;
  private opposingGrid: Grid;
  // private gestureRecognition: GestureRecognition;

  private ownPlayerNo: PlayerNo;
  private roomConfig: RoomConfig;
  private playerConfig: PlayerConfig;
  private shipConfig: ShipConfig;

  private offsetX = 200;
  private additionalOffsetX = 1010;
  private offsetY = 250;

  inputLogic: InputLogic;
  keyboardInputLogic: KeyboardInputLogic;
  pointerAndGestureInputLogic: PointerAndGestureInputLogic;

  constructor() {
    super('Game');

    this.opposingGrid = new Grid({
      gridOffsetX: this.offsetX,
      gridOffsetY: this.offsetY,
      cellSize: cellSize,
    });
    this.ownGrid = new Grid({
      gridOffsetX: this.offsetX + this.additionalOffsetX,
      gridOffsetY: this.offsetY,
      cellSize: cellSize,
    });
    // this.gestureRecognition = new GestureRecognition();
  }

  create(args: { roomConfig: RoomConfig; playerConfig: PlayerConfig; ownPlayerNo: PlayerNo; shipConfig: ShipConfig }) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.ownPlayerNo = args.ownPlayerNo;
    this.roomConfig = args.roomConfig;
    this.playerConfig = args.playerConfig;
    this.shipConfig = args.shipConfig;

    this.ownGrid.drawGrid(this.add, '→');
    this.opposingGrid.drawGrid(this.add, '←');
    this.drawPlayerNames();
    this.drawShipCount();
    this.drawInstructions();
    this.drawOwnShips();

    gameRadio.drawRadio(this.add);
    gameRadio.sendMessage(`${this.playerConfig[args.playerConfig.firstTurn]} begins`);

    this.inputLogic = new InputLogic(this);
    this.keyboardInputLogic = new KeyboardInputLogic(
      this,
      this.opposingGrid,
      this.offsetX,
      this.offsetY,
      this.inputLogic,
    );
    this.inputLogic.registerExtension(this.keyboardInputLogic);
    this.pointerAndGestureInputLogic = new PointerAndGestureInputLogic(
      this,
      { x: this.offsetX - cellSize, y: this.offsetY - cellSize },
      (gridSize + 2) * cellSize,
      (gridSize + 2) * cellSize,
      this.inputLogic,
      this.opposingGrid,
    );
    this.inputLogic.registerExtension(this.pointerAndGestureInputLogic);

    socket.on('attack', (args) => {
      ((grid: Grid) => {
        const { xPx, yPx } = grid.getGridCellToCoord(args.coord);
        const tint = {
          [Modality.POINT_AND_ClICK]: 0x000000,
          [Modality.VOICE]: 0x0047ab,
          [Modality.GESTURE]: 0xd2042d,
          [Modality.KEYBOARD]: 0x1c7b1c,
        }[args.modality];
        this.drawMove(xPx, yPx, args.hit, tint);
        if (args.sunkenShip) {
          const shipCount = grid.shipCount.getShipCount();
          shipCount[args.sunkenShip.size - 1]--;
          grid.shipCount.updateShipCount(shipCount);
          const attackedPlayer = this.playerConfig[((args.playerNo + 1) % 2) as PlayerNo];
          gameRadio.sendMessage(
            `${attackedPlayer}'${attackedPlayer.slice(-1) === 's' ? '' : 's'} ${args.sunkenShip.name} (size ${args.sunkenShip.size}) was sunk`,
          );
        }
      })(args.playerNo === this.ownPlayerNo ? this.opposingGrid : this.ownGrid);
    });

    socket.on('gameOver', (args) => {
      this.scene.start('GameOver', {
        winner: args.winner,
        playerConfig: this.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
      });
    });
  }

  private drawPlayerNames() {
    this.add
      .text(this.offsetX + this.additionalOffsetX, this.offsetY - 100, `You: ${this.playerConfig[this.ownPlayerNo]}`, {
        ...defaultFont,
        fontSize: 36,
      })
      .setOrigin(0, 1);
    this.add
      .text(
        this.offsetX,
        this.offsetY - 100,
        `Your opponent: ${this.playerConfig[((this.ownPlayerNo + 1) % 2) as PlayerNo]}`,
        { ...defaultFont, fontSize: 36 },
      )
      .setOrigin(0, 1);
  }

  private drawShipCount() {
    this.add.image(980 + 50, this.offsetY + 290, 'ships');
    for (let i = 0; i < 4; i++) {
      this.opposingGrid.shipCount.shipCountReference.push(
        this.add.text(845 + 50, this.offsetY + 20 + i * 140, '', defaultFont),
      );
      this.ownGrid.shipCount.shipCountReference.push(
        this.add.text(1075 + 50, this.offsetY + 20 + i * 140, '', defaultFont),
      );
    }
    this.opposingGrid.shipCount.updateShipCount(this.roomConfig.availableShips);
    this.ownGrid.shipCount.updateShipCount(this.roomConfig.availableShips);
  }

  // private addInputCanvas() {
  //   const canvas = this.add
  //     .rectangle(this.offsetX - cellSize, this.offsetY - cellSize, (gridSize + 2) * cellSize, (gridSize + 2) * cellSize)
  //     .setOrigin(0)
  //     .setStrokeStyle(4, 0xd2042d, 0.2);
  //   const pencil = this.add
  //     .image(this.offsetX + gridSize * cellSize + 40, this.offsetY + gridSize * cellSize + 40, 'pencil')
  //     .setAlpha(0.2);
  //   let gestureCoords: Coord[];
  //   let graphics: Phaser.GameObjects.Graphics | undefined;
  //   let lastPosition: Phaser.Math.Vector2 | undefined;
  //   let drawing = false;

  //   canvas.setInteractive();
  //   canvas.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  //     if (pointer.leftButtonDown()) {
  //       console.warn('The gesture Input is currently being used');
  //       gameRadio.sendMessage('The gesture Input is currently being used');
  //       return;

  //       const { x, y } = this.opposingGrid.getCoordToGridCell(pointer.x, pointer.y);
  //       socket.emit('attack', { coord: { x, y }, modality: Modality.POINT_AND_ClICK }, this.attackErrorHandler);
  //     } else if (pointer.rightButtonDown()) {
  //       drawing = true;
  //       gestureCoords = [];
  //       canvas.setStrokeStyle(4, 0xd2042d, 1);
  //       pencil.setAlpha(1);
  //       lastPosition = pointer.position.clone();
  //       graphics = this.add.graphics();
  //     }
  //   });
  //   canvas.on('pointermove', (pointer: Phaser.Input.Pointer) => {
  //     if (drawing && graphics && lastPosition) {
  //       graphics
  //         .lineStyle(6, 0xd2042d, 1)
  //         .beginPath()
  //         .moveTo(lastPosition.x, lastPosition.y)
  //         .lineTo(pointer.position.x, pointer.position.y)
  //         .strokePath()
  //         .closePath();
  //       lastPosition = pointer.position.clone();
  //       gestureCoords.push({ x: Math.round(lastPosition.x), y: Math.round(lastPosition.y) });
  //     }
  //   });
  //   const stopDrawing = () => {
  //     if (drawing && graphics) {
  //       drawing = false;
  //       canvas.setStrokeStyle(4, 0xd2042d, 0.2);
  //       pencil.setAlpha(0.2);
  //       graphics.destroy();
  //       const { gesture, d } = this.gestureRecognition.getGesture(gestureCoords);
  //       if (d > 1000) {
  //         gameRadio.sendMessage("Gesture couldn't be recognized with sufficient certainty");
  //       } else {
  //         gameRadio.sendMessage(`Gesture "${this.gestureRecognition.getGestureName(gesture)}" was recognized`);
  //         if (gesture === Gestures.CIRCLE) {
  //           socket.emit(
  //             'attack',
  //             { coord: { x: 0, y: 0 }, randomCoord: true, modality: Modality.GESTURE },
  //             this.attackErrorHandler,
  //           );
  //           // todo die Koordinate wird noch übermittelt; evtl. kann das der Startpunkt für weitere Funktionalitäten sein
  //         } else {
  //           const snakeMovement = {
  //             [Gestures.ARROW_UP]: { up: 1, right: 0 },
  //             [Gestures.ARROW_DOWN]: { up: -1, right: 0 },
  //             [Gestures.ARROW_RIGHT]: { up: 0, right: 1 },
  //             [Gestures.ARROW_LEFT]: { up: 0, right: -1 },
  //           }[gesture];
  //           socket.emit(
  //             'attack',
  //             { coord: { x: 0, y: 0 }, snakeMovement: snakeMovement, modality: Modality.GESTURE },
  //             this.attackErrorHandler,
  //           );
  //         }
  //       }
  //     }
  //   };
  //   canvas.on('pointerup', stopDrawing);
  //   canvas.on('pointerout', stopDrawing);
  // }

  private drawInstructions() {
    this.add
      .text(
        this.offsetX + this.additionalOffsetX,
        this.offsetY - 55,
        `To connect Alexa, use the code: ${this.roomConfig.roomId}${this.ownPlayerNo}`,
        defaultFont,
      )
      .setOrigin(0, 1);
    this.add
      .image(this.offsetX + this.additionalOffsetX + cellSize - 10, 900, 'circle-gesture-instruction')
      .setOrigin(1);
    this.add
      .image(this.offsetX + this.additionalOffsetX + cellSize - 20, 975, 'arrow-gestures-instruction')
      .setOrigin(1);
    this.add
      .text(
        this.offsetX + this.additionalOffsetX + cellSize + 10,
        880,
        'Attack randomly by drawing a circle',
        defaultFont,
      )
      .setOrigin(0, 1);
    this.add
      .text(
        this.offsetX + this.additionalOffsetX + cellSize + 10,
        936,
        'Use snake control by drawing arrows',
        defaultFont,
      )
      .setOrigin(0, 1);
    this.add
      .text(
        this.offsetX + this.additionalOffsetX + cellSize + 10,
        968,
        '(draw by right-clicking in the red box)',
        defaultFont,
      )
      .setOrigin(0, 1);
  }

  private drawMove(xPx: number, yPx: number, hit: boolean, tint: number) {
    this.add.image(xPx + cellSize / 2, yPx + cellSize / 2, hit ? 'explosion' : 'dot').setTint(tint);
  }

  private drawOwnShips() {
    this.shipConfig.forEach((s) => {
      const ship = new Ship(
        {
          name: s.name,
          size: s.size,
          shipId: s.shipId,
          orientation: s.orientation,
        },
        this.ownGrid.getCoordToGridCell.bind(this.ownGrid),
        this.ownGrid.getGridCellToCoord.bind(this.ownGrid),
        { x: s.x, y: s.y },
      );
      ship.drawShip(this, true);
    });
  }
}
