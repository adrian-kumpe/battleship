interface GridDrawData {
  gridOffsetX: number;
  gridOffsetY: number;
  cellSize: number;
}

export class BattleshipGrid {
  private shipCount: number[] = [];
  public shipCountReference: Phaser.GameObjects.Text[] = [];

  constructor(private gridDrawData: GridDrawData) {}

  public getShipCount() {
    return this.shipCount;
  }
  public updateShipCount(newShipCount: number[]) {
    newShipCount.forEach((c, i) => {
      if (this.shipCountReference[i]) {
        this.shipCount[i] = newShipCount[i];
        this.shipCountReference[i].text = c > 0 ? c + 'x' : '0';
      }
    });
  }

  /**
   * convert grid coordinates to x and y pixel coordinates
   * @param x coordinate
   * @param y coordinate
   * @returns xPx and yPx (pixel coordinates)
   */
  public getGridCellToCoordinate(x: number, y: number): { xPx: number; yPx: number } {
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
  public getCoordinateToGridCell(xPx: number, yPx: number): { x: number; y: number } {
    return {
      x: Math.floor((xPx - this.gridDrawData.gridOffsetX) / this.gridDrawData.cellSize),
      y: Math.floor((yPx - this.gridDrawData.gridOffsetY) / this.gridDrawData.cellSize),
    };
  }
}
