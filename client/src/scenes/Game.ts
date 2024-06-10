import { Scene } from 'phaser';
//import { BattleshipGrid } from '../elements/BattleshipGrid';
import { socket } from '../sockets';
import { PlayerNo, RoomConfig } from '@shared/models';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  /*attackGrid: BattleshipGrid;
  defenseGrid: BattleshipGrid;*/

  constructor() {
    super('Game');

    socket.on('attack', (args) => {
      //let x: number = args.coord.x;
      //let y: number = args.coord.y;

      if (args.playerNo == PlayerNo.PLAYER1) {
        //const shipId = this.attackGrid.placeMove(x, y);
        //const { xPx, yPx } = this.attackGrid.getGridCellToCoordinate(x, y);
        //this.drawMove(xPx, yPx, args.result);
      } else {
        //const shipId = this.attackGrid.placeMove(x, y);
        //const { xPx, yPx } = this.defenseGrid.getGridCellToCoordinate(x, y);
        //this.drawMove(xPx, yPx, args.result);
      }
    });

    socket.on('gameOver', (args) => {
      this.scene.start('GameOver', { winner: args.winner.toString() });
    });
  }

  create(args: { roomConfig: RoomConfig }) {
    this.camera = this.cameras.main;
    this.drawGrid();
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);
    console.log(args);

    //this.attackGrid = new BattleshipGrid(args.roomConfig.mode, { gridOffsetX: 50, gridOffsetY: 170, cellSize: 50 });
    //this.defenseGrid = new BattleshipGrid(args.roomConfig.mode, { gridOffsetX: 550, gridOffsetY: 170, cellSize: 50 });
  }

  /*changeScene(data: { winner: string }) {
    this.scene.start('GameOver', data);
  }


  private checkGameOver(): boolean {
    if (this.attackGrid.getAllShipsSunken()) {
      // player has won the game
      alert('player has won the game');
      this.changeScene({ winner: 'player' });
      return true;
    }
    if (this.defenseGrid.getAllShipsSunken()) {
      // the opponent has won the game
      alert('the opponent has won the game');
      this.changeScene({ winner: 'opponent' });
      return true;
    }
    return false;
  }


  private playerMove(x: number, y: number) {
    if (this.attackGrid.isValidMove(x, y)) {
      const shipId = this.attackGrid.placeMove(x, y);
      const { xPx, yPx } = this.attackGrid.getGridCellToCoordinate(x, y);
      if (shipId !== undefined) {
        this.drawMove(xPx, yPx, 'H');
        if (this.attackGrid.getShipWasSunken(shipId)) {
          this.displayShipWasSunken(shipId);
        }
      } else {
        this.drawMove(xPx, yPx, 'M');
      }
      if (!this.checkGameOver()) {
        this.opponentMove();
      }
    }
  }

  private opponentMove() {
    let x, y;
    do {
      x = Math.floor(Math.random() * 8);
      y = Math.floor(Math.random() * 8);
    } while (!this.defenseGrid.isValidMove(x, y));
    const shipId = this.defenseGrid.placeMove(x, y);
    const { xPx, yPx } = this.defenseGrid.getGridCellToCoordinate(x, y);
    if (shipId !== undefined) {
      this.drawMove(xPx, yPx, 'H');
      if (this.defenseGrid.getShipWasSunken(shipId)) {
        this.displayShipWasSunken(shipId);
      }
    } else {
      this.drawMove(xPx, yPx, 'M');
    }
    this.checkGameOver();
  }*/

  /*private displayShipWasSunken(shipId: number) {
    alert('Schiff ' + shipId + ' wurde versenkt!');
  }*/

  drawGrid() {
    const gridSize = 8;
    const cellSize = 50;
    const offsetY = 170;
    let offsetX = 50;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        const rect = this.add.rectangle(x, y, cellSize, cellSize, 0xffffff);
        rect.setStrokeStyle(3, 0x000000).setOrigin(0).strokeColor;
        rect.setInteractive();
        rect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.leftButtonDown()) {
            socket.emit('attack', { coord: { x: x, y: y } }, (error?: string) => {
              if (error) {
                console.log(error);
              }
            });
          }
          if (pointer.rightButtonDown()) {
            alert('rechtsklick');
            // todo es müsste noch rechtsklick geben, mit dem man markieren kann, dass dort kein schiff ist
          }
        });
      }
    }

    /*this.gameText = */ this.add.text(offsetX + 15, offsetY - 35, 'A    B    C    D    E    F    G    H', {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#000000',
    });

    /*this.gameText = */ this.add.text(offsetX - 25, offsetY + 5, '1 \n\n2 \n\n3 \n\n4 \n\n5 \n\n6 \n\n7 \n\n8', {
      fontFamily: 'Arial Black',
      fontSize: 23,
      color: '#000000',
    });

    /*this.gameText = */ this.add.text(
      offsetX,
      offsetY + 435,
      'There are 3 ships to hit\n    aircraft-carrier with size: 5\n    cruiser with size: 3\n    destroyer with size: 2',
      {
        fontFamily: 'Arial Black',
        fontSize: 24,
        color: '#000000',
      },
    );

    offsetX = 550;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        this.add.rectangle(x, y, cellSize, cellSize, 0xffffff).setStrokeStyle(3, 0x000000).setOrigin(0).strokeColor;
      }
    }

    /*this.gameText = */ this.add.text(offsetX + 15, offsetY - 35, 'A    B    C    D    E    F    G    H', {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#000000',
    });

    /*this.gameText = */ this.add.text(offsetX - 25, offsetY + 5, '1 \n\n2 \n\n3 \n\n4 \n\n5 \n\n6 \n\n7 \n\n8', {
      fontFamily: 'Arial Black',
      fontSize: 23,
      color: '#000000',
    });

    /*this.gameText = */ this.add.text(offsetX, offsetY + 435, "The opponent tries to guess \nyour ships' positions.", {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#000000',
    });
  }

  /*private drawMove(xPx: number, yPx: number, char: string) {
    this.gameText = this.add.text(xPx + 15, yPx + 15, char, {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#000000',
    });
  }*/
}
