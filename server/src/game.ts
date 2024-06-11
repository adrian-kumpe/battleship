import { AttackResult, Coord, PartialShipConfig } from './models';
import { Client } from '.';

export class BattleshipGameBoard {
  private dirtyCoord: Coord[] = [];
  private _shipConfig?: (PartialShipConfig & { calculatedCoord: Coord[] })[];
  public set shipConfig(shipConfig: (PartialShipConfig & Coord)[]) {
    this._shipConfig = shipConfig.map((s) => {
      const calculatedCoord: Coord[] = [];
      for (let i = 0; i < s.ship.size; i++) {
        if (s.orientation === '↔️') {
          calculatedCoord.push({ x: s.x + i, y: s.y });
        } else {
          calculatedCoord.push({ x: s.x, y: s.y + i });
        }
      }
      return {
        ship: s.ship,
        shipId: s.shipId,
        orientation: s.orientation,
        calculatedCoord: calculatedCoord,
      };
    });
  }

  constructor(public client: Client) {}

  public getPlayerReady(): boolean {
    return !!this._shipConfig;
  }

  public getGameOver(): boolean {
    return (
      this._shipConfig !== undefined && this._shipConfig.flatMap(({ calculatedCoord }) => calculatedCoord).length === 0
    );
  }

  public getValidAttack(coord: Coord): string | undefined {
    return this.dirtyCoord.some((c) => c.x === coord.x && c.y === coord.y) ? 'Coord already attacked' : undefined;
  }

  public placeAttack(coord: Coord): AttackResult {
    this.dirtyCoord.push(coord);
    for (const s of this._shipConfig ?? []) {
      const index = s.calculatedCoord.findIndex((c) => c.x === coord.x && c.y === coord.y);
      if (index > -1) {
        s.calculatedCoord.splice(index, 1);
        // todo ist es sinnvoll, dass hier das Ship zurückgegeben wird?
        return { result: 'H', sunkenShip: s.calculatedCoord.length === 0 ? s.ship : undefined };
      }
    }
    return {
      result: 'M',
    };
  }
}
