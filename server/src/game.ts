import { AttackResult, Coord, ShipConfig } from '@shared/models';
import { Client } from '.';

export class BattleshipGameBoard {
  private _shipsConfig?: (ShipConfig & { calculatedCoord: Coord[] })[] = [];
  public set shipsConfig(shipsConfig: (ShipConfig & Coord)[]) {
    this._shipsConfig = shipsConfig.map((s) => {
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
    return !!this._shipsConfig;
  }

  public getGameOver(): boolean {
    return !!this._shipsConfig && this._shipsConfig.flatMap(({ calculatedCoord }) => calculatedCoord).length > 0;
  }

  public placeAttack(coord: Coord): AttackResult {
    this._shipsConfig?.forEach((s) => {
      const index = s.calculatedCoord.findIndex((c) => c.x === coord.x && c.y === coord.y);
      if (index > -1) {
        s.calculatedCoord.splice(index, 1);
        // todo ist es sinnvoll, dass hier das Ship zurückgegeben wird?
        return { result: 'H', sunkenShip: s.calculatedCoord.length === 0 ? s.ship : undefined };
      }
    });
    return {
      result: 'M',
    };
  }
}
