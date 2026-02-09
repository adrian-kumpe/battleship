import { MARKER_ROLE, NOT_SEEN_LIMIT, STREAK_THRESHOLD } from '../config';

interface PinnedMarker {
  role: MARKER_ROLE;
  streak: number;
  notSeen: number;
}

/**
 * manages which pins are handled as detected
 * configure {@link NOT_SEEN_LIMIT} and {@link STREAK_THRESHOLD}
 */
export class PinManager {
  /** currently recognized markers of the left grid */
  private currentLeftGridPins: (PinnedMarker | undefined)[] = [];
  /** currently recognized markers of the right grid */
  private currentRightGridPins: (PinnedMarker | undefined)[] = [];

  private deleteOldPins(placement: (PinnedMarker | undefined)[]) {
    for (let i = 0; i < placement.length; i++) {
      if (placement[i] && placement[i]!.notSeen > NOT_SEEN_LIMIT) {
        placement[i] = undefined;
      }
    }
  }

  /** update grid pins; handle new markers */
  updateGridPins(placement: (MARKER_ROLE | undefined)[], grid: '⬅️' | '➡️') {
    const currentPins = grid === '⬅️' ? this.currentLeftGridPins : this.currentRightGridPins;
    placement.forEach((p, i) => {
      if (p === undefined && currentPins[i]) {
        currentPins[i].notSeen += 1;
      }
      if (p === undefined) {
        return;
      }
      if (currentPins[i] && currentPins[i].role === p) {
        currentPins[i].streak += 1;
        currentPins[i].notSeen = 0;
      } else {
        currentPins[i] = {
          role: p,
          streak: 1,
          notSeen: 0,
        };
      }
    });
    this.deleteOldPins(currentPins);
  }

  /** get all pins having a streak greater than 10 */
  getPins(grid: '⬅️' | '➡️'): (MARKER_ROLE | undefined)[] {
    const currentPins = grid === '⬅️' ? this.currentLeftGridPins : this.currentRightGridPins;
    return currentPins.map((p) => (p && p.streak > STREAK_THRESHOLD ? p.role : undefined));
  }
}
