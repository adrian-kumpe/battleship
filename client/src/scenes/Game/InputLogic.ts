import { InputLogicBase } from '../../modalities/InputLogicBase';
import { cellSize, gameRadio, gridSize, socket } from '../../main';
import { Coord, Modality } from '../../shared/models';
import { Game } from './Game';

/**
 * methods all modalities need to include so InputLogic can call them
 * @interface
 */
export interface IInputLogicExtension {
  attackCoordExt(): void;
  selectCoordExt(): void;
  reloadExt(): void;
}

/**
 * basic methods to interact in Game
 */
export class InputLogic extends InputLogicBase<IInputLogicExtension> {
  /** whether the player can attack (reloading is necessary) */
  private oneInTheChamber = true;
  /** slot for the selected coord */
  selectedCoord: Coord = { x: 0, y: 0 };
  /** frame to display the selected coord */
  crosshairRef: Phaser.GameObjects.Container;
  /** slot to check whether the crosshair is exclusively used */
  exclusiveInputInUse = false;

  constructor(protected scene: Game) {
    super();
    const { xPx, yPx } = this.scene.opposingGrid.getGridCellToCoord(0, 0);
    const container = this.scene.add.container(xPx, yPx);
    const frame = this.scene.add.rectangle(0, 0, cellSize, cellSize).setOrigin(0).setStrokeStyle(7, 0x00ff00);
    container.add(frame);
    const graphics = this.scene.add
      .graphics()
      .lineStyle(2, 0xff0000, 1)
      .lineBetween(-1000, 35, 0, 35)
      .lineBetween(70, 35, 1000, 35)
      .lineBetween(35, -1000, 35, 0)
      .lineBetween(35, 70, 35, 1000)
      .strokePath();
    container.add(graphics);
    const maskShape = this.scene.add
      .graphics()
      .fillStyle(0xffffff)
      .setAlpha(0)
      .fillRect(
        this.scene.offsetX - cellSize,
        this.scene.offsetY - cellSize,
        cellSize * (gridSize + 2),
        cellSize * (gridSize + 2),
      );
    const mask = maskShape.createGeometryMask();
    container.setMask(mask);
    this.crosshairRef = container;
  }

  getSelectedCellCoord(): Coord {
    return this.scene.opposingGrid.getCoordToGridCell(this.crosshairRef.x, this.crosshairRef.y);
  }

  /**
   * confirm the attack on the selected coord
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.attackCoordExt());
  })
  confirmAttack() {
    if (!this.oneInTheChamber) {
      const error = 'You need to reload';
      console.warn(error);
      gameRadio.sendMessage('Error: ' + error);
      return;
    }
    const coord = this.getSelectedCellCoord();
    socket.emit('attack', { coord: coord, modality: Modality.GESTURE }, (error?: string) => {
      if (error) {
        console.warn(error);
        gameRadio.sendMessage('Error: ' + error);
      } else {
        this.oneInTheChamber = false;
      }
    });
    // todo modality entfernen
  }

  /**
   * select a coord (cell of the grid)
   * @param coord - coord to select
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.selectCoordExt());
  })
  selectCoord(coord: Coord) {
    const coordWithinGrid = coord && coord.x >= 0 && coord.x < gridSize && coord.y >= 0 && coord.y < gridSize;
    if (coordWithinGrid) {
      this.selectedCoord = coord;
      const { xPx, yPx } = this.scene.opposingGrid.getGridCellToCoord(coord);
      this.crosshairRef.setX(xPx).setY(yPx);
    }
  }

  /**
   * reload after placing an attack
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.reloadExt());
  })
  reload() {
    console.log('reload!'); // todo das muss noch ins gui
    this.oneInTheChamber = true;
  }
}
