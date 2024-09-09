import { defaultFont, gridSize } from '../main';
import { Coord } from '../shared/models';

interface GridDrawData {
  gridOffsetX: number;
  gridOffsetY: number;
  cellSize: number;
}

export class Grid {
  shipCount: ShipCountService;

  constructor(private gridDrawData: GridDrawData) {
    this.shipCount = new ShipCountService();
  }

  /** draw the grid into a given scene */
  drawGrid(add: Phaser.GameObjects.GameObjectFactory, legendPosition: '→' | '←') {
    // todo gridDrawData entfernen damit das kleiner wird?
    for (let row = 0; row < gridSize; row++) {
      // draw horizontal legend (A-F)
      add.text(
        this.gridDrawData.gridOffsetX + 25 + this.gridDrawData.cellSize * row,
        this.gridDrawData.gridOffsetY - 35,
        String.fromCharCode(65 + row),
        defaultFont,
      );
      // draw vertical legend (1-8)
      add.text(
        legendPosition === '→'
          ? this.gridDrawData.gridOffsetX + 15 + this.gridDrawData.cellSize * gridSize
          : this.gridDrawData.gridOffsetX - 30,
        this.gridDrawData.gridOffsetY + 20 + this.gridDrawData.cellSize * row,
        (row + 1).toString(),
        defaultFont,
      );
      // draw grid lines
      for (let col = 0; col < gridSize; col++) {
        const x = this.gridDrawData.gridOffsetX + col * this.gridDrawData.cellSize;
        const y = this.gridDrawData.gridOffsetY + row * this.gridDrawData.cellSize;
        add
          .rectangle(x, y, this.gridDrawData.cellSize, this.gridDrawData.cellSize)
          .setStrokeStyle(4, 0x000000)
          .setOrigin(0);
      }
    }
  }

  /**
   * convert grid coordinates to x and y pixel coordinates
   * @param x and y coordinate
   * @returns xPx and yPx (pixel coordinates)
   */
  getGridCellToCoord(xy: Coord): { xPx: number; yPx: number };
  getGridCellToCoord(x: number, y: number): { xPx: number; yPx: number };
  getGridCellToCoord(p1: Coord | number, p2?: number): { xPx: number; yPx: number } {
    const x: number = typeof p1 === 'object' ? p1.x : p1;
    const y: number = typeof p1 === 'object' ? p1.y : p2!;
    return {
      xPx: this.gridDrawData.gridOffsetX + this.gridDrawData.cellSize * x,
      yPx: this.gridDrawData.gridOffsetY + this.gridDrawData.cellSize * y,
    };
  }

  /**
   * convert x and y pixel coordinates to grid coordinates
   * @param xPx and yPx pixel coordinate
   * @returns x and y coordinates
   */
  getCoordToGridCell(xPx: number, yPx: number): { x: number; y: number } {
    return {
      x: Math.floor((xPx - this.gridDrawData.gridOffsetX) / this.gridDrawData.cellSize),
      y: Math.floor((yPx - this.gridDrawData.gridOffsetY) / this.gridDrawData.cellSize),
    };
  }
}

class ShipCountService {
  /** array with the number of ships for each size */
  private shipCount: number[] = [];
  /** reference to update gui elements */
  shipCountReference: Phaser.GameObjects.Text[] = [];

  getShipCount() {
    return this.shipCount;
  } // todo einfach beim update zurückgeben?

  updateShipCount(newShipCount: number[]) {
    newShipCount.forEach((c, i) => {
      if (this.shipCountReference[i]) {
        this.shipCount[i] = newShipCount[i];
        this.shipCountReference[i].text = c > 0 ? c + 'x' : '0';
      }
    });
  }
}
