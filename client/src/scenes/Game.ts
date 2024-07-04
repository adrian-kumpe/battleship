import { Scene } from 'phaser';
import { BattleshipGrid } from '../elements/BattleshipGrid';
import { PlayerNo, RoomConfig } from '../shared/models';
import { socket } from '../main';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  private attackGrid: BattleshipGrid;
  private defenseGrid: BattleshipGrid;

  private ownPlayerNo: PlayerNo;
  private roomConfig: RoomConfig;

  private gridSize = 8;
  private cellSize = 70;
  private offsetY = 270;
  private offsetX = 200;
  private additionalOffsetX = 960 + 50;

  private defaultFont: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Arial Rounded MT',
    fontSize: 24,
    color: '#000000',
  };

  constructor() {
    super('Game');

    this.attackGrid = new BattleshipGrid({
      gridOffsetX: this.offsetX,
      gridOffsetY: this.offsetY,
      cellSize: this.cellSize,
    });

    this.defenseGrid = new BattleshipGrid({
      gridOffsetX: this.offsetX + this.additionalOffsetX,
      gridOffsetY: this.offsetY,
      cellSize: this.cellSize,
    });

    socket.on('attack', (args) => {
      const x = args.coord.x;
      const y = args.coord.y;
      ((grid: BattleshipGrid) => {
        const { xPx, yPx } = grid.getGridCellToCoordinate(x, y);
        this.drawMove(xPx, yPx, args.hit);
        this.drawFrame(xPx, yPx);
        if (args.sunkenShip) {
          const shipCount = grid.getShipCount();
          shipCount[args.sunkenShip.ship.size - 1]--;
          grid.updateShipCount(shipCount);
        }
      })(args.playerNo === this.ownPlayerNo ? this.attackGrid : this.defenseGrid);
    });

    socket.on('gameOver', (args) => {
      this.scene.start('GameOver', { winner: args.winner?.toString() ?? '' });
    });
  }

  preload() {
    this.load.svg('ships', 'assets/ships.svg', { width: 200, height: 800 });
    this.load.svg('explosion', 'assets/explosion.svg', { width: 60, height: 60 });
    this.load.svg('dot', 'assets/dot.svg', { width: 60, height: 60 });
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.camera = this.cameras.main;
    this.ownPlayerNo = args.ownPlayerNo;
    this.roomConfig = args.roomConfig;
    this.drawGridTODO();
    this.camera.setBackgroundColor(0xffffff);

    // this.background = this.add.image(512, 384, 'background');
    // this.background.setAlpha(0.5);

    this.drawGrid(this.offsetX, 'l');
    this.drawGrid(this.offsetX + this.additionalOffsetX, 'r');
    this.drawPlayerNames();
    this.drawShipCount();
    this.addInputCanvas();
  }

  private drawGrid = (offsetX: number, legendPosition: 'r' | 'l') => {
    for (let row = 0; row < this.gridSize; row++) {
      this.add.text(
        offsetX + 25 + this.cellSize * row,
        this.offsetY - 35,
        String.fromCharCode(65 + row),
        this.defaultFont,
      );
      this.add.text(
        legendPosition === 'r' ? offsetX + 15 + this.cellSize * this.gridSize : offsetX - 30,
        this.offsetY + 20 + this.cellSize * row,
        (row + 1).toString(),
        this.defaultFont,
      );
      for (let col = 0; col < this.gridSize; col++) {
        const x = offsetX + col * this.cellSize;
        const y = this.offsetY + row * this.cellSize;
        this.add.rectangle(x, y, this.cellSize, this.cellSize).setStrokeStyle(4, 0x000000).setOrigin(0);
      }
    }
  };

  private drawPlayerNames() {
    // this.add.text(
    //   this.offsetX,
    //   50,
    //   'You: Player Nr. ' +
    //     ((this.ownPlayerNo === PlayerNo.PLAYER1 ? PlayerNo.PLAYER2 : PlayerNo.PLAYER1) + 1).toString(),
    //   {
    //     fontFamily: 'Arial Rounded MT',
    //     fontSize: 36,
    //     color: '#000000',
    //   },
    // );
    // this.add.text(160, 50, 'Player Nr. ' + (this.ownPlayerNo + 1).toString(), this.defaultFont);
  }

  private drawShipCount = () => {
    this.add.image(980 + 50, this.offsetY + 290, 'ships');
    for (let i = 0; i < 4; i++) {
      this.attackGrid.shipCountReference.push(
        this.add.text(845 + 50, this.offsetY + 20 + i * 140, '1x', this.defaultFont),
      );
      this.defenseGrid.shipCountReference.push(
        this.add.text(1075 + 50, this.offsetY + 20 + i * 140, '1x', this.defaultFont),
      );
    }
    this.attackGrid.updateShipCount(this.roomConfig.availableShips);
    this.defenseGrid.updateShipCount(this.roomConfig.availableShips);
  };

  private addInputCanvas() {
    const canvas = this.add
      .rectangle(
        this.offsetX - this.cellSize,
        this.offsetY - this.cellSize,
        (this.gridSize + 2) * this.cellSize,
        (this.gridSize + 2) * this.cellSize,
      )
      .setOrigin(0)
      .setStrokeStyle(4, 0xdadada);
    let graphics: Phaser.GameObjects.Graphics | undefined;
    let lastPosition: Phaser.Math.Vector2 | undefined;
    let drawing = false;

    canvas.setInteractive();
    canvas.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const { x, y } = this.attackGrid.getCoordinateToGridCell(pointer.x, pointer.y);
        socket.emit('attack', { coord: { x: x, y: y } }, (error?: string) => {
          if (error) {
            console.log(error);
          }
        });
      }
      if (pointer.rightButtonDown()) {
        console.log('rightButtonDown');
        drawing = true;
        lastPosition = pointer.position.clone();
        graphics = this.add.graphics();
      }
    });
    canvas.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (drawing && graphics && lastPosition) {
        console.log(pointer.position.clone());
        graphics.lineStyle(7, 0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(lastPosition.x, lastPosition.y);
        graphics.lineTo(pointer.position.x, pointer.position.y);
        graphics.strokePath();
        graphics.closePath();
        lastPosition = pointer.position.clone();
      }
    });
    const stopDrawing = () => {
      if (drawing && graphics) {
        drawing = false;
        graphics.destroy();
        return true;
      }
    };
    canvas.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (stopDrawing()) {
        console.log('pointerup');
        console.log(pointer);
      }
    });
    canvas.on('pointerout', () => {
      // todo ist das sinnvoll?
      stopDrawing();
    });
  }

  drawGridTODO() {
    // this.add.text(
    //   735,
    //   offsetY + 545,
    //   'Alexa-Code: ' + this.ownroomConfig.roomId.toString() + this.ownPlayerNo.toString(),
    //   {
    //     fontFamily: 'Arial Black',
    //     fontSize: 24,
    //     color: '#000000',
    //   },
    // );
  }

  private drawMove(xPx: number, yPx: number, hit: boolean) {
    this.add.image(xPx + 5, yPx + 5, hit ? 'explosion' : 'dot').setOrigin(0);
  }

  private drawFrame(x: number, y: number) {
    const frame = this.add.rectangle(x, y, 50, 50, 0xffffff);
    frame.setAlpha(0);
    frame.setStrokeStyle(6, 0xc10307).setOrigin(0).strokeColor;
  }
}
