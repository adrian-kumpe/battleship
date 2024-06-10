interface GridDrawData {
  gridOffsetX: number;
  gridOffsetY: number;
  cellSize: number;
}

export class BattleshipGrid {
  //private gridSize: number = 8;
  constructor(private gridDrawData: GridDrawData) {}

  /**
   * convert coordinates to x and y pixel coordinates
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
}
