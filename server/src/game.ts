import { AttackResult, Coord, ErrorCode, ShipDefinition, ShipInstance, ShipPlacement } from './shared/models';
import { Client } from '.';

export class BattleshipGameBoard {
  /** array containing all previously attacked coordinates */
  private dirtyCoords: Coord[] = [
    { x: -1, y: -1 }, // so you can use arrow gestures right from the beginning of the game
  ];
  /** array w/ the player's ships; contains meta information about the ships, their main coord and a continuously updated array with coordinates they occupy */
  private _shipPlacement?: (ShipDefinition & ShipInstance & Coord & { occupiedCoords: Coord[] })[];
  public set shipPlacement(shipPlacement: ShipPlacement) {
    this._shipPlacement = shipPlacement.map((s) => {
      const occupiedCoords: Coord[] = [];
      for (let i = 0; i < s.size; i++) {
        occupiedCoords.push(s.orientation === '↔️' ? { x: s.x + i, y: s.y } : { x: s.x, y: s.y + i });
      }
      return {
        name: s.name,
        size: s.size,
        shipId: s.shipId,
        orientation: s.orientation,
        occupiedCoords: occupiedCoords,
        x: s.x,
        y: s.y,
      };
    });
  }

  constructor(
    public client: Client,
    private boardSize: number,
  ) {}

  public getPlayerReady(): boolean {
    return !!this._shipPlacement;
  }

  public getGameOver(): boolean {
    return (
      this._shipPlacement !== undefined &&
      this._shipPlacement.flatMap(({ occupiedCoords: occupiedCoords }) => occupiedCoords).length === 0
    );
  }

  public placeAttack(coord: Coord): AttackResult {
    this.dirtyCoords.push(coord);
    for (const s of this._shipPlacement ?? []) {
      const index = s.occupiedCoords.findIndex((c) => c.x === coord.x && c.y === coord.y);
      if (index > -1) {
        s.occupiedCoords.splice(index, 1);
        return { hit: true, sunken: s.occupiedCoords.length === 0 ? s : undefined };
      }
    }
    return {
      hit: false,
    };
  }

  public checkCoordAvailable(coord: Coord): ErrorCode | undefined {
    return this.dirtyCoords.some((c) => c.x === coord.x && c.y === coord.y) ? ErrorCode.COORD_NOT_AVAILABLE : undefined;
  }
}
