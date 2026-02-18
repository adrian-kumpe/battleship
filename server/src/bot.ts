import { Coord, ErrorCode, ShipDefinition, ShipPlacement, shipDefinitions, ShipInstance } from './shared/models';
import { BattleshipGameBoard } from './game';

/**
 * Standard-Schiffskonfiguration für den Bot
 * Diese Konfiguration wird immer verwendet für konsistentes Testing
 */
const DEFAULT_BOT_SHIP_PLACEMENT: ShipPlacement = [
  { size: 1, name: 'destroyer', shipId: 36, orientation: '↔️', x: 0, y: 0 },
  { size: 1, name: 'destroyer', shipId: 37, orientation: '↔️', x: 0, y: 3 },
  { size: 2, name: 'cruiser', shipId: 38, orientation: '↕️', x: 4, y: 6 },
  { size: 2, name: 'cruiser', shipId: 39, orientation: '↔️', x: 0, y: 7 },
  { size: 2, name: 'cruiser', shipId: 40, orientation: '↔️', x: 5, y: 1 },
  { size: 2, name: 'cruiser', shipId: 41, orientation: '↕️', x: 7, y: 6 },
  { size: 3, name: 'battleship', shipId: 42, orientation: '↕️', x: 2, y: 1 },
  { size: 3, name: 'battleship', shipId: 43, orientation: '↔️', x: 0, y: 5 },
  { size: 4, name: 'aircraft carrier', shipId: 44, orientation: '↔️', x: 4, y: 3 },
];

/**
 * Gibt die Standard-Schiffskonfiguration für den Bot zurück
 */
export function getBotShipPlacement(): ShipPlacement {
  return DEFAULT_BOT_SHIP_PLACEMENT;
}

export class BotPlayer {
  /** Koordinaten von Treffern, die noch nicht versenkt wurden */
  private hitCoords: Coord[] = [];

  constructor(
    private board: BattleshipGameBoard,
    private boardSize: number,
  ) {}

  /**
   * Fügt einen Treffer hinzu, der noch nicht versenkt wurde
   */
  public addHit(coord: Coord): void {
    this.hitCoords.push(coord);
  }

  /**
   * Entfernt alle Treffer eines versenkten Schiffes
   */
  public removeHitsForSunkenShip(sunkenShip: ShipDefinition & ShipInstance & Coord): void {
    const shipCoords: Coord[] = [];
    for (let i = 0; i < sunkenShip.size; i++) {
      shipCoords.push(
        sunkenShip.orientation === '↔️'
          ? { x: sunkenShip.x + i, y: sunkenShip.y }
          : { x: sunkenShip.x, y: sunkenShip.y + i },
      );
    }
    this.hitCoords = this.hitCoords.filter(
      (hit) => !shipCoords.some((shipCoord) => shipCoord.x === hit.x && shipCoord.y === hit.y),
    );
  }

  /**
   * Berechnet die nächste Angriffs-Koordinate
   * - Wenn es Treffer gibt, die noch nicht versenkt wurden, greift der Bot benachbarte Zellen an
   * - Bei 2+ Treffern erkennt der Bot die Ausrichtung des Schiffes und greift nur in dieser Richtung an
   * - Ansonsten greift der Bot eine zufällige Koordinate an
   */
  public getNextAttackCoord(): Coord {
    // Wenn es Treffer gibt, die noch nicht versenkt wurden
    if (this.hitCoords.length > 0) {
      // Bei 2+ Treffern: Erkenne die Ausrichtung des Schiffes
      if (this.hitCoords.length >= 2) {
        // Prüfe ob alle Treffer in einer Linie sind
        const allSameX = this.hitCoords.every((hit) => hit.x === this.hitCoords[0].x);
        const allSameY = this.hitCoords.every((hit) => hit.y === this.hitCoords[0].y);

        if (allSameX) {
          // Vertikales Schiff (↕️) - greife oben und unten an
          const minY = Math.min(...this.hitCoords.map((h) => h.y));
          const maxY = Math.max(...this.hitCoords.map((h) => h.y));
          const x = this.hitCoords[0].x;

          const candidates: Coord[] = [];
          // Prüfe oben
          if (minY > 0) {
            const upperCoord = { x, y: minY - 1 };
            if (!this.board.checkCoordAvailable(upperCoord)) {
              candidates.push(upperCoord);
            }
          }
          // Prüfe unten
          if (maxY < this.boardSize - 1) {
            const lowerCoord = { x, y: maxY + 1 };
            if (!this.board.checkCoordAvailable(lowerCoord)) {
              candidates.push(lowerCoord);
            }
          }

          if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
          }
        } else if (allSameY) {
          // Horizontales Schiff (↔️) - greife links und rechts an
          const minX = Math.min(...this.hitCoords.map((h) => h.x));
          const maxX = Math.max(...this.hitCoords.map((h) => h.x));
          const y = this.hitCoords[0].y;

          const candidates: Coord[] = [];
          // Prüfe links
          if (minX > 0) {
            const leftCoord = { x: minX - 1, y };
            if (!this.board.checkCoordAvailable(leftCoord)) {
              candidates.push(leftCoord);
            }
          }
          // Prüfe rechts
          if (maxX < this.boardSize - 1) {
            const rightCoord = { x: maxX + 1, y };
            if (!this.board.checkCoordAvailable(rightCoord)) {
              candidates.push(rightCoord);
            }
          }

          if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
          }
        }
      }

      // Bei 1 Treffer oder wenn die Ausrichtung noch nicht klar ist:
      // Sammle alle benachbarten Koordinaten von ALLEN Treffern
      const allAdjacentCoords: Coord[] = [];
      for (const hit of this.hitCoords) {
        const adjacentCoords = this.board.getAdjacentCoords(hit);
        allAdjacentCoords.push(...adjacentCoords);
      }

      // Dedupliziere die Koordinaten (entferne Duplikate)
      const uniqueAdjacentCoords = allAdjacentCoords.filter(
        (coord, index, arr) => arr.findIndex((c) => c.x === coord.x && c.y === coord.y) === index,
      );

      if (uniqueAdjacentCoords.length > 0) {
        // Wähle zufällig eine der benachbarten Koordinaten
        return uniqueAdjacentCoords[Math.floor(Math.random() * uniqueAdjacentCoords.length)];
      }
    }

    // Ansonsten: zufällige Koordinate
    return this.board.getRandomCoord();
  }
}
