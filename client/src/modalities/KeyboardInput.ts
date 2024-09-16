import { cellSize } from '../main';
import { Coord } from '../shared/models';
import { Grid } from '../elements/Grid';

/**
 * generic methods to handle keyboard inputs
 * @abstract
 */
export abstract class KeyboardInput {
  /** frame to display the focused coord */
  protected focusedCellRef?: Phaser.GameObjects.Rectangle;

  /** navigate w/ arrow keys */
  protected arrowKeyAction(shiftX: -1 | 0 | 1, shiftY: -1 | 0 | 1) {
    this.focusCell(shiftX, shiftY);
  }

  /** get the grid coord of the focused cell */
  protected getFocusCellCoord(): Coord | undefined {
    if (this.focusedCellRef) {
      return this.placingGrid.getCoordToGridCell(this.focusedCellRef.x, this.focusedCellRef.y);
    }
    return undefined;
  }

  /** change the focused cell by a shift, a new coord or to undefined */
  protected focusCell(cell?: Coord): void;
  protected focusCell(shiftX: number, shiftY: number): void;
  protected focusCell(p1?: Coord | number, p2?: number) {
    const drawFocusedCell = (coord: { xPx: number; yPx: number }) => {
      if (!this.focusedCellRef) {
        this.focusedCellRef = this.scene.add
          .rectangle(coord.xPx, coord.yPx, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(7, 0xff4500);
      } else {
        this.focusedCellRef.setX(coord.xPx).setY(coord.yPx);
      }
    };
    if (typeof p1 === 'undefined') {
      this.focusedCellRef = p1;
      return;
    }
    if (typeof p1 === 'object') {
      drawFocusedCell(this.placingGrid.getGridCellToCoord(p1));
      return;
    }
    if (typeof p1 === 'number') {
      const { initialX, initialY } = {
        initialX: this.offsetX + cellSize,
        initialY: this.offsetY - cellSize,
      };
      drawFocusedCell({
        xPx: (this.focusedCellRef?.x ?? initialX) + cellSize * p1,
        yPx: (this.focusedCellRef?.y ?? initialY) + cellSize * (p2 ?? 0),
      });
      return;
    }
  }

  constructor(
    protected scene: Phaser.Scene,
    protected placingGrid: Grid,
    protected offsetX: number,
    protected offsetY: number,
  ) {}
}
