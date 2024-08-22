import { defaultFont, gridSize } from '../main';

interface GridDrawData {
  gridOffsetX: number;
  gridOffsetY: number;
  cellSize: number;
}

export class BattleshipGrid {
  public shipCount: ShipCountService;

  constructor(private gridDrawData: GridDrawData) {
    this.shipCount = new ShipCountService();
  }

  /** draw the grid into a given scene */
  public drawGrid(add: Phaser.GameObjects.GameObjectFactory, legendPosition: '→' | '←') {
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
   * @param x coordinate
   * @param y coordinate
   * @returns xPx and yPx (pixel coordinates)
   */
  public getGridCellToCoord(x: number, y: number): { xPx: number; yPx: number } {
    return {
      xPx: this.gridDrawData.gridOffsetX + this.gridDrawData.cellSize * x,
      yPx: this.gridDrawData.gridOffsetY + this.gridDrawData.cellSize * y,
    };
  }

  /**
   * convert x and y pixel coordinates to grid coordinates
   * @param xPx pixel coordinate
   * @param yPx pixel coordinate
   * @returns x and y coordinates
   */
  public getCoordToGridCell(xPx: number, yPx: number): { x: number; y: number } {
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
  public shipCountReference: Phaser.GameObjects.Text[] = [];

  public getShipCount() {
    return this.shipCount;
  } // todo einfach beim update zurückgeben?

  public updateShipCount(newShipCount: number[]) {
    newShipCount.forEach((c, i) => {
      if (this.shipCountReference[i]) {
        this.shipCount[i] = newShipCount[i];
        this.shipCountReference[i].text = c > 0 ? c + 'x' : '0';
      }
    });
  }
}
