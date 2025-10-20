import { Scene } from 'phaser';
import { Grid } from '../../elements/Grid';
import { ErrorCode, ErrorMessage, GameData, GameOverData, PlayerNo } from '../../shared/models';
import { socket, gameRadio, defaultFont, layoutConfig } from '../../main';
import { Ship } from '../../elements/Ship';
import { KeyboardInputLogic } from './KeyboardInputLogic';
import { InputLogic } from './InputLogic';
import { PointerAndGestureInputLogic } from './PointerAndGestureInputLogic';
import { GestureRecognition } from '../../elements/Gestures';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  private ownGrid: Grid;
  opposingGrid: Grid;
  private gestureRecognition: GestureRecognition;

  private gameData: GameData;

  inputLogic: InputLogic;
  keyboardInputLogic: KeyboardInputLogic;
  pointerAndGestureInputLogic: PointerAndGestureInputLogic;

  constructor() {
    super('Game');

    this.opposingGrid = new Grid({
      gridOffsetX: layoutConfig.leftGridOffsetX,
      gridOffsetY: layoutConfig.gridOffsetY,
      cellSize: layoutConfig.cellSize,
    });
    this.ownGrid = new Grid({
      gridOffsetX: layoutConfig.rightGridOffsetX,
      gridOffsetY: layoutConfig.gridOffsetY,
      cellSize: layoutConfig.cellSize,
    });
    this.gestureRecognition = new GestureRecognition();
  }

  create(data: GameData) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.gameData = data;

    this.ownGrid.drawGrid(this.add, '→');
    this.opposingGrid.drawGrid(this.add, '←');
    this.drawPlayerNames();
    this.drawShipCount();
    this.drawInstructions();
    this.drawOwnShips();

    gameRadio.initializeRadio(this.add);
    gameRadio.sendMessage(`${this.gameData.playerNames[data.firstTurn]} begins`);

    this.inputLogic = new InputLogic(this);
    this.keyboardInputLogic = new KeyboardInputLogic(
      this,
      this.opposingGrid,
      layoutConfig.leftGridOffsetX,
      layoutConfig.gridOffsetY,
      this.inputLogic,
    );
    this.inputLogic.registerExtension(this.keyboardInputLogic);
    this.pointerAndGestureInputLogic = new PointerAndGestureInputLogic(
      this,
      { x: layoutConfig.leftGridOffsetX - layoutConfig.cellSize, y: layoutConfig.gridOffsetY - layoutConfig.cellSize },
      (layoutConfig.boardSize + 2) * layoutConfig.cellSize,
      (layoutConfig.boardSize + 2) * layoutConfig.cellSize,
      this.inputLogic,
      this.opposingGrid,
      this.gestureRecognition,
    );
    this.inputLogic.registerExtension(this.pointerAndGestureInputLogic);

    socket.on('attack', (args) => {
      ((grid: Grid) => {
        grid.drawResultMarker(args.coord, args.hit ? 'explosion' : 'dot', this.add);
        // phaser client sends 'respond' event automatically, no response by the player needed
        if (args.playerNo !== this.gameData.playerNo) {
          socket.emit('respond', { hit: args.hit, sunken: args.sunken }, (error?: ErrorCode) => {
            if (error) {
              console.warn(ErrorMessage[error]);
              gameRadio.sendMessage('Error: ' + ErrorMessage[error]);
            }
          });
        }
        if (args.sunken) {
          const shipCount = grid.shipCount.getShipCount();
          shipCount[args.sunken.size - 1]--;
          grid.shipCount.updateShipCount(shipCount);
          const attackedPlayer = this.gameData.playerNames[((args.playerNo + 1) % 2) as PlayerNo];
          gameRadio.sendMessage(
            `${attackedPlayer}'${attackedPlayer.slice(-1) === 's' ? '' : 's'} ${args.sunken.name} (size ${args.sunken.size}) was sunk`,
          );
        }
      })(args.playerNo === this.gameData.playerNo ? this.opposingGrid : this.ownGrid);
    });

    socket.on('gameOver', (args) => {
      this.scene.start('GameOver', {
        winner: args.winner,
        playerNames: this.gameData.playerNames,
        playerNo: this.gameData.playerNo,
      } satisfies GameOverData);
    });
  }

  private drawPlayerNames() {
    this.add
      .text(
        layoutConfig.rightGridOffsetX,
        layoutConfig.gridOffsetY - 100,
        `You: ${this.gameData.playerNames[this.gameData.playerNo]}`,
        {
          ...defaultFont,
          fontSize: 36,
        },
      )
      .setOrigin(0, 1);
    this.add
      .text(
        layoutConfig.leftGridOffsetX,
        layoutConfig.gridOffsetY - 100,
        `Your opponent: ${this.gameData.playerNames[((this.gameData.playerNo + 1) % 2) as PlayerNo]}`,
        { ...defaultFont, fontSize: 36 },
      )
      .setOrigin(0, 1);
  }

  private drawShipCount() {
    return; // todo soll erstmal nicht angezeigt werden
    for (let i = 0; i < 4; i++) {
      this.opposingGrid.shipCount.shipCountReference.push(
        this.add.text(845 + 50, layoutConfig.gridOffsetY + 20 + i * 140, '', defaultFont),
      );
      this.ownGrid.shipCount.shipCountReference.push(
        this.add.text(1075 + 50, layoutConfig.gridOffsetY + 20 + i * 140, '', defaultFont),
      );
    }
    this.opposingGrid.shipCount.updateShipCount(this.gameData.roomConfig.availableShips);
    this.ownGrid.shipCount.updateShipCount(this.gameData.roomConfig.availableShips);
  }

  private drawInstructions() {
    return; // todo soll erstmal nicht angezeigt werden
    this.add
      .image(layoutConfig.rightGridOffsetX + layoutConfig.cellSize - 10, 900, 'circle-gesture-instruction')
      .setOrigin(1);
    this.add
      .image(layoutConfig.rightGridOffsetX + layoutConfig.cellSize - 20, 975, 'arrow-gestures-instruction')
      .setOrigin(1);
    this.add
      .text(
        layoutConfig.rightGridOffsetX + layoutConfig.cellSize + 10,
        880,
        'Attack randomly by drawing a circle',
        defaultFont,
      )
      .setOrigin(0, 1);
    this.add
      .text(
        layoutConfig.rightGridOffsetX + layoutConfig.cellSize + 10,
        936,
        'Use snake control by drawing arrows',
        defaultFont,
      )
      .setOrigin(0, 1);
    this.add
      .text(
        layoutConfig.rightGridOffsetX + layoutConfig.cellSize + 10,
        968,
        '(draw by right-clicking in the red box)',
        defaultFont,
      )
      .setOrigin(0, 1);
  }

  private drawOwnShips() {
    this.gameData.shipPlacement.forEach((s) => {
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
