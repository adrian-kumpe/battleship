import { Coord } from '../shared/models';

export enum Gestures {
  'CIRCLE',
  'ARROW_UP',
  'ARROW_DOWN',
  'ARROW_LEFT',
  'ARROW_RIGHT',
}

/** @constant */
const gestureTemplate: { gesture: Gestures; coords: Coord[] }[] = [
  {
    gesture: Gestures.CIRCLE,
    // prettier-ignore
    coords: [ { x: 100, y: 50 }, { x: 50 + 25 * 3 ** (1 / 3), y: 75 }, { x: 75, y: 50 + 25 * 3 ** (1 / 3) }, { x: 50, y: 100 }, { x: 25, y: 50 + 25 * 3 ** (1 / 3) }, { x: 50 - 25 * 3 ** (1 / 3), y: 75 }, { x: 0, y: 50 }, { x: 50 - 25 * 3 ** (1 / 3), y: 25 }, { x: 25, y: 50 - 25 * 3 ** (1 / 3) }, { x: 50, y: 0 }, { x: 75, y: 50 - 25 * 3 ** (1 / 3) }, { x: 50 + 25 * 3 ** (1 / 3), y: 25 }, ],
  },
  {
    gesture: Gestures.ARROW_UP,
    // prettier-ignore
    coords: [ { x: 0, y: 100 }, { x: 10, y: 80 }, { x: 20, y: 60 }, { x: 30, y: 40 }, { x: 40, y: 20 }, { x: 50, y: 0 }, { x: 60, y: 20 }, { x: 70, y: 40 }, { x: 80, y: 60 }, { x: 90, y: 80 }, { x: 100, y: 100 }, ],
  },
  {
    gesture: Gestures.ARROW_DOWN,
    // prettier-ignore
    coords: [ { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 20, y: 40 }, { x: 30, y: 60 }, { x: 40, y: 80 }, { x: 50, y: 100 }, { x: 60, y: 80 }, { x: 70, y: 60 }, { x: 80, y: 40 }, { x: 90, y: 20 }, { x: 100, y: 0 }, ],
  },
  {
    gesture: Gestures.ARROW_LEFT,
    // prettier-ignore
    coords: [ { x: 100, y: 0 }, { x: 80, y: 10 }, { x: 60, y: 20 }, { x: 40, y: 30 }, { x: 20, y: 40 }, { x: 0, y: 50 }, { x: 20, y: 60 }, { x: 40, y: 70 }, { x: 60, y: 80 }, { x: 80, y: 90 }, { x: 100, y: 100 }, ],
  },
  {
    gesture: Gestures.ARROW_RIGHT,
    // prettier-ignore
    coords: [ { x: 0, y: 0 }, { x: 20, y: 10 }, { x: 40, y: 20 }, { x: 60, y: 30 }, { x: 80, y: 40 }, { x: 100, y: 50 }, { x: 80, y: 60 }, { x: 60, y: 70 }, { x: 40, y: 80 }, { x: 20, y: 90 }, { x: 0, y: 100 }, ],
  },
];

export class GestureRecognition {
  private distFunc = (a: Coord, b: Coord) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  constructor() {}

  public getGesture(gestureCoords: Coord[]): { gesture: Gestures; d: number } {
    const result: { gesture: Gestures; d: number }[] = [];
    gestureTemplate
      // .concat(
      //   gestureTemplate.map((g) => {
      //     return { gesture: g.gesture, coords: g.coords.reverse() };
      //   }),
      // )
      .forEach((gesture) => {
        const dtw = new DynamicTimeWarping(
          this.normalize(gesture.coords),
          this.normalize(gestureCoords),
          this.distFunc,
        );
        result.push({ gesture: gesture.gesture, d: dtw.getDistance() });
      });
    result.sort((a: { gesture: Gestures; d: number }, b: { gesture: Gestures; d: number }) => {
      return a.d - b.d;
    });
    console.log(result); // todo bei reversed coord: warum p gleich?
    return result[0];
  }

  public getGestureName(gesture: Gestures): string {
    switch (gesture) {
      case Gestures.CIRCLE:
        return 'circle';
      case Gestures.ARROW_UP:
        return 'arrow-up';
      case Gestures.ARROW_DOWN:
        return 'arrow-down';
      case Gestures.ARROW_LEFT:
        return 'arrow-left';
      default:
      case Gestures.ARROW_RIGHT:
        return 'arrow-right';
    }
  }

  private normalize(gestureCoords: Coord[]): Coord[] {
    const xCoords = gestureCoords.map(({ x }) => x);
    const yCoords = gestureCoords.map(({ y }) => y);
    const xMin = Math.min(...xCoords);
    const yMin = Math.min(...yCoords);
    const x100 = Math.max(...xCoords) - xMin;
    const y100 = Math.max(...yCoords) - yMin;
    return gestureCoords.map((c) => {
      return { x: Math.round(((c.x - xMin) / x100) * 100), y: Math.round(((c.y - yMin) / y100) * 100) };
    });
  }
}

/**
 * @see {@link https://github.com/GordonLesti/dynamic-time-warping/issues/4 source of code}
 */
export default class DynamicTimeWarping {
  private ser1: any;
  private ser2: any;
  private distFunc: any;
  private distance: any;
  private matrix: any;

  constructor(ts1: any, ts2: any, distanceFunction: any) {
    this.ser1 = ts1;
    this.ser2 = ts2;
    this.distFunc = distanceFunction;
    this.distance = null;
    this.matrix = null;
  }

  getDistance() {
    if (this.distance !== null) {
      return this.distance;
    }
    this.matrix = [];
    for (var i = 0; i < this.ser1.length; i++) {
      this.matrix[i] = [];
      for (var j = 0; j < this.ser2.length; j++) {
        var cost = Infinity;
        if (i > 0) {
          cost = Math.min(cost, this.matrix[i - 1][j]);
          if (j > 0) {
            cost = Math.min(cost, this.matrix[i - 1][j - 1]);
            cost = Math.min(cost, this.matrix[i][j - 1]);
          }
        } else {
          if (j > 0) {
            cost = Math.min(cost, this.matrix[i][j - 1]);
          } else {
            cost = 0;
          }
        }
        this.matrix[i][j] = cost + this.distFunc(this.ser1[i], this.ser2[j]);
      }
    }
    return this.matrix[this.ser1.length - 1][this.ser2.length - 1];
  }
}
