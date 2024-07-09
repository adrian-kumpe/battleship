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
    coords: [{x: 65,y: 0},{x: 62,y: 0},{x: 54,y: 0},{x: 46,y: 0},{x: 46,y: 0},{x: 43,y: 0},{x: 41,y: 3},{x: 38,y: 3},{x: 30,y: 10},{x: 28,y: 13},{x: 25,y: 13},{x: 22,y: 13},{x: 22,y: 13},{x: 22,y: 13},{x: 19,y: 15},{x: 19,y: 18},{x: 9,y: 24},{x: 9,y: 24},{x: 9,y: 28},{x: 6,y: 31},{x: 6,y: 33},{x: 6,y: 36},{x: 3,y: 36},{x: 0,y: 42},{x: 0,y: 46},{x: 0,y: 49},{x: 0,y: 49},{x: 0,y: 51},{x: 0,y: 54},{x: 0,y: 60},{x: 3,y: 64},{x: 3,y: 67},{x: 3,y: 69},{x: 3,y: 72},{x: 6,y: 72},{x: 9,y: 75},{x: 9,y: 78},{x: 12,y: 78},{x: 16,y: 82},{x: 16,y: 85},{x: 19,y: 85},{x: 19,y: 85},{x: 22,y: 85},{x: 22,y: 88},{x: 28,y: 90},{x: 28,y: 93},{x: 30,y: 93},{x: 30,y: 96},{x: 35,y: 96},{x: 35,y: 96},{x: 38,y: 96},{x: 46,y: 96},{x: 46,y: 96},{x: 46,y: 100},{x: 49,y: 100},{x: 54,y: 100},{x: 57,y: 100},{x: 59,y: 100},{x: 59,y: 100},{x: 65,y: 100},{x: 68,y: 100},{x: 72,y: 100},{x: 72,y: 100},{x: 78,y: 100},{x: 81,y: 100},{x: 84,y: 100},{x: 84,y: 96},{x: 87,y: 96},{x: 91,y: 93},{x: 94,y: 90},{x: 97,y: 90},{x: 97,y: 88},{x: 97,y: 85},{x: 97,y: 78},{x: 97,y: 75},{x: 97,y: 72},{x: 100,y: 72},{x: 100,y: 72},{x: 100,y: 69},{x: 100,y: 67},{x: 100,y: 60},{x: 100,y: 57},{x: 100,y: 54},{x: 100,y: 51},{x: 100,y: 49},{x: 100,y: 49},{x: 100,y: 46},{x: 100,y: 36},{x: 100,y: 36},{x: 100,y: 33},{x: 97,y: 31},{x: 97,y: 28},{x: 97,y: 24},{x: 97,y: 21},{x: 97,y: 21},{x: 97,y: 18},{x: 94,y: 15},{x: 94,y: 13},{x: 91,y: 13},{x: 91,y: 13},{x: 87,y: 13},{x: 87,y: 10},{x: 84,y: 10},{x: 84,y: 3},{x: 84,y: 3},{x: 84,y: 0},{x: 81,y: 0},{x: 78,y: 0},{x: 75,y: 0},{x: 72,y: 0},{x: 72,y: 0},{x: 68,y: 0},{x: 65,y: 0},{x: 59,y: 0},{x: 59,y: 0},{x: 57,y: 0},{x: 57,y: 3}],
    // coords: [ { x: 100, y: 50 }, { x: 50 + 25 * 3 ** (1 / 3), y: 75 }, { x: 75, y: 50 + 25 * 3 ** (1 / 3) }, { x: 50, y: 100 }, { x: 25, y: 50 + 25 * 3 ** (1 / 3) }, { x: 50 - 25 * 3 ** (1 / 3), y: 75 }, { x: 0, y: 50 }, { x: 50 - 25 * 3 ** (1 / 3), y: 25 }, { x: 25, y: 50 - 25 * 3 ** (1 / 3) }, { x: 50, y: 0 }, { x: 75, y: 50 - 25 * 3 ** (1 / 3) }, { x: 50 + 25 * 3 ** (1 / 3), y: 25 }, { x: 100, y: 50 }, ],
  },
  {
    gesture: Gestures.ARROW_UP,
    // prettier-ignore
    coords: [{x: 0,y: 83},{x: 2,y: 83},{x: 2,y: 82},{x: 2,y: 81},{x: 2,y: 80},{x: 4,y: 80},{x: 4,y: 79},{x: 4,y: 78},{x: 4,y: 75},{x: 6,y: 72},{x: 6,y: 71},{x: 6,y: 70},{x: 6,y: 70},{x: 9,y: 64},{x: 12,y: 61},{x: 12,y: 60},{x: 16,y: 50},{x: 19,y: 48},{x: 19,y: 45},{x: 19,y: 45},{x: 19,y: 44},{x: 21,y: 44},{x: 25,y: 35},{x: 25,y: 35},{x: 25,y: 34},{x: 27,y: 33},{x: 27,y: 32},{x: 28,y: 30},{x: 28,y: 30},{x: 32,y: 25},{x: 32,y: 25},{x: 33,y: 22},{x: 33,y: 21},{x: 33,y: 20},{x: 35,y: 20},{x: 36,y: 19},{x: 36,y: 18},{x: 37,y: 15},{x: 37,y: 15},{x: 37,y: 13},{x: 37,y: 11},{x: 40,y: 11},{x: 40,y: 10},{x: 40,y: 10},{x: 41,y: 10},{x: 41,y: 9},{x: 42,y: 9},{x: 42,y: 7},{x: 42,y: 6},{x: 42,y: 5},{x: 44,y: 5},{x: 44,y: 5},{x: 44,y: 4},{x: 44,y: 3},{x: 44,y: 2},{x: 45,y: 2},{x: 45,y: 0},{x: 45,y: 0},{x: 47,y: 0},{x: 49,y: 0},{x: 49,y: 0},{x: 50,y: 4},{x: 50,y: 5},{x: 50,y: 5},{x: 52,y: 6},{x: 53,y: 7},{x: 56,y: 14},{x: 56,y: 17},{x: 58,y: 18},{x: 58,y: 19},{x: 63,y: 28},{x: 64,y: 32},{x: 65,y: 34},{x: 67,y: 36},{x: 69,y: 40},{x: 69,y: 41},{x: 72,y: 45},{x: 75,y: 52},{x: 75,y: 53},{x: 75,y: 55},{x: 80,y: 63},{x: 81,y: 65},{x: 81,y: 67},{x: 81,y: 68},{x: 83,y: 68},{x: 83,y: 70},{x: 84,y: 71},{x: 88,y: 78},{x: 88,y: 80},{x: 91,y: 81},{x: 91,y: 83},{x: 91,y: 85},{x: 92,y: 85},{x: 92,y: 85},{x: 94,y: 85},{x: 94,y: 87},{x: 94,y: 87},{x: 94,y: 90},{x: 97,y: 93},{x: 97,y: 94},{x: 97,y: 95},{x: 99,y: 95},{x: 99,y: 95},{x: 100,y: 95},{x: 100,y: 96},{x: 100,y: 97},{x: 100,y: 97},{x: 100,y: 98},{x: 100,y: 100}],
    // coords: [ { x: 0, y: 100 }, { x: 10, y: 80 }, { x: 20, y: 60 }, { x: 30, y: 40 }, { x: 40, y: 20 }, { x: 50, y: 0 }, { x: 60, y: 20 }, { x: 70, y: 40 }, { x: 80, y: 60 }, { x: 90, y: 80 }, { x: 100, y: 100 }, ],
  },
  {
    gesture: Gestures.ARROW_DOWN,
    // prettier-ignore
    coords: [{x: 0,y: 0},{x: 0,y: 2},{x: 1,y: 2},{x: 1,y: 3},{x: 1,y: 5},{x: 2,y: 9},{x: 3,y: 9},{x: 4,y: 12},{x: 5,y: 15},{x: 16,y: 37},{x: 19,y: 44},{x: 26,y: 54},{x: 26,y: 56},{x: 27,y: 56},{x: 27,y: 58},{x: 29,y: 59},{x: 30,y: 62},{x: 32,y: 67},{x: 33,y: 68},{x: 36,y: 70},{x: 37,y: 72},{x: 37,y: 72},{x: 37,y: 74},{x: 37,y: 76},{x: 38,y: 76},{x: 38,y: 77},{x: 39,y: 77},{x: 39,y: 79},{x: 40,y: 79},{x: 40,y: 79},{x: 40,y: 80},{x: 41,y: 80},{x: 41,y: 83},{x: 41,y: 85},{x: 41,y: 86},{x: 43,y: 86},{x: 44,y: 86},{x: 44,y: 88},{x: 45,y: 88},{x: 45,y: 89},{x: 45,y: 91},{x: 46,y: 91},{x: 46,y: 93},{x: 46,y: 93},{x: 46,y: 95},{x: 48,y: 98},{x: 50,y: 98},{x: 50,y: 100},{x: 50,y: 100},{x: 51,y: 100},{x: 51,y: 100},{x: 51,y: 100},{x: 53,y: 95},{x: 54,y: 93},{x: 54,y: 93},{x: 54,y: 91},{x: 55,y: 89},{x: 55,y: 89},{x: 55,y: 88},{x: 57,y: 86},{x: 58,y: 83},{x: 59,y: 80},{x: 60,y: 79},{x: 60,y: 79},{x: 60,y: 79},{x: 60,y: 77},{x: 61,y: 76},{x: 62,y: 76},{x: 62,y: 74},{x: 62,y: 72},{x: 65,y: 68},{x: 66,y: 65},{x: 67,y: 65},{x: 69,y: 59},{x: 69,y: 58},{x: 73,y: 51},{x: 74,y: 49},{x: 74,y: 47},{x: 77,y: 42},{x: 79,y: 41},{x: 79,y: 38},{x: 80,y: 37},{x: 81,y: 37},{x: 81,y: 35},{x: 83,y: 30},{x: 86,y: 28},{x: 87,y: 26},{x: 87,y: 24},{x: 88,y: 24},{x: 88,y: 24},{x: 88,y: 23},{x: 88,y: 23},{x: 89,y: 21},{x: 91,y: 20},{x: 91,y: 18},{x: 93,y: 18},{x: 93,y: 18},{x: 93,y: 15},{x: 94,y: 15},{x: 94,y: 15},{x: 95,y: 14},{x: 96,y: 14},{x: 96,y: 12},{x: 97,y: 12},{x: 97,y: 11},{x: 97,y: 9},{x: 97,y: 9},{x: 97,y: 9},{x: 97,y: 7},{x: 97,y: 5},{x: 97,y: 3},{x: 98,y: 3},{x: 98,y: 2},{x: 98,y: 2},{x: 100,y: 2}],
    // coords: [ { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 20, y: 40 }, { x: 30, y: 60 }, { x: 40, y: 80 }, { x: 50, y: 100 }, { x: 60, y: 80 }, { x: 70, y: 60 }, { x: 80, y: 40 }, { x: 90, y: 20 }, { x: 100, y: 0 }, ],
  },
  {
    gesture: Gestures.ARROW_LEFT,
    // prettier-ignore
    // coords: [ { x: 100, y: 0 }, { x: 80, y: 10 }, { x: 60, y: 20 }, { x: 40, y: 30 }, { x: 20, y: 40 }, { x: 0, y: 50 }, { x: 20, y: 60 }, { x: 40, y: 70 }, { x: 60, y: 80 }, { x: 80, y: 90 }, { x: 100, y: 100 }, ],
    coords: [{x: 100,y: 0},{x: 99,y: 1},{x: 97,y: 1},{x: 96,y: 1},{x: 96,y: 2},{x: 96,y: 3},{x: 96,y: 3},{x: 92,y: 5},{x: 92,y: 5},{x: 92,y: 6},{x: 91,y: 7},{x: 90,y: 7},{x: 89,y: 7},{x: 89,y: 8},{x: 88,y: 8},{x: 87,y: 8},{x: 86,y: 9},{x: 83,y: 9},{x: 77,y: 12},{x: 76,y: 12},{x: 75,y: 12},{x: 74,y: 13},{x: 73,y: 14},{x: 71,y: 14},{x: 69,y: 15},{x: 67,y: 15},{x: 66,y: 16},{x: 61,y: 17},{x: 59,y: 17},{x: 54,y: 20},{x: 53,y: 20},{x: 51,y: 21},{x: 49,y: 21},{x: 45,y: 22},{x: 43,y: 25},{x: 41,y: 25},{x: 40,y: 25},{x: 35,y: 26},{x: 30,y: 27},{x: 30,y: 27},{x: 29,y: 28},{x: 28,y: 28},{x: 26,y: 28},{x: 25,y: 28},{x: 22,y: 31},{x: 14,y: 33},{x: 13,y: 33},{x: 12,y: 33},{x: 11,y: 33},{x: 4,y: 35},{x: 4,y: 35},{x: 3,y: 35},{x: 2,y: 35},{x: 2,y: 37},{x: 0,y: 37},{x: 0,y: 38},{x: 0,y: 39},{x: 0,y: 40},{x: 0,y: 41},{x: 0,y: 41},{x: 0,y: 43},{x: 1,y: 44},{x: 2,y: 45},{x: 3,y: 45},{x: 3,y: 45},{x: 4,y: 46},{x: 4,y: 47},{x: 4,y: 47},{x: 6,y: 48},{x: 7,y: 49},{x: 9,y: 49},{x: 11,y: 52},{x: 12,y: 53},{x: 13,y: 54},{x: 14,y: 55},{x: 22,y: 61},{x: 22,y: 61},{x: 24,y: 61},{x: 24,y: 62},{x: 26,y: 63},{x: 27,y: 65},{x: 29,y: 65},{x: 30,y: 67},{x: 30,y: 68},{x: 33,y: 68},{x: 35,y: 69},{x: 43,y: 75},{x: 44,y: 75},{x: 47,y: 77},{x: 47,y: 77},{x: 48,y: 78},{x: 50,y: 79},{x: 53,y: 81},{x: 54,y: 82},{x: 57,y: 83},{x: 58,y: 84},{x: 61,y: 85},{x: 61,y: 85},{x: 68,y: 90},{x: 70,y: 91},{x: 71,y: 92},{x: 73,y: 92},{x: 75,y: 94},{x: 76,y: 94},{x: 82,y: 97},{x: 83,y: 97},{x: 84,y: 97},{x: 84,y: 98},{x: 86,y: 98},{x: 88,y: 98},{x: 89,y: 98},{x: 89,y: 99},{x: 90,y: 99},{x: 91,y: 99},{x: 91,y: 100},{x: 92,y: 100}],
  },
  {
    gesture: Gestures.ARROW_RIGHT,
    // prettier-ignore
    // coords: [ { x: 0, y: 0 }, { x: 20, y: 10 }, { x: 40, y: 20 }, { x: 60, y: 30 }, { x: 80, y: 40 }, { x: 100, y: 50 }, { x: 80, y: 60 }, { x: 60, y: 70 }, { x: 40, y: 80 }, { x: 20, y: 90 }, { x: 0, y: 100 }, ],
    coords: [{x: 0,y: 0},{x: 3,y: 1},{x: 5,y: 3},{x: 5,y: 4},{x: 5,y: 4},{x: 11,y: 7},{x: 12,y: 10},{x: 12,y: 10},{x: 13,y: 10},{x: 23,y: 16},{x: 23,y: 17},{x: 26,y: 19},{x: 39,y: 26},{x: 40,y: 27},{x: 41,y: 27},{x: 43,y: 27},{x: 51,y: 33},{x: 53,y: 33},{x: 55,y: 34},{x: 57,y: 37},{x: 57,y: 37},{x: 59,y: 38},{x: 64,y: 42},{x: 68,y: 43},{x: 68,y: 44},{x: 70,y: 44},{x: 72,y: 46},{x: 73,y: 46},{x: 74,y: 47},{x: 76,y: 47},{x: 80,y: 50},{x: 80,y: 50},{x: 82,y: 52},{x: 83,y: 52},{x: 84,y: 53},{x: 84,y: 54},{x: 86,y: 54},{x: 86,y: 54},{x: 87,y: 54},{x: 87,y: 56},{x: 90,y: 56},{x: 90,y: 57},{x: 91,y: 57},{x: 91,y: 57},{x: 91,y: 59},{x: 93,y: 59},{x: 93,y: 60},{x: 94,y: 60},{x: 95,y: 60},{x: 95,y: 62},{x: 97,y: 62},{x: 97,y: 62},{x: 97,y: 62},{x: 97,y: 63},{x: 99,y: 63},{x: 100,y: 64},{x: 100,y: 66},{x: 100,y: 68},{x: 99,y: 68},{x: 99,y: 68},{x: 97,y: 68},{x: 97,y: 69},{x: 94,y: 70},{x: 93,y: 72},{x: 91,y: 72},{x: 91,y: 73},{x: 84,y: 76},{x: 83,y: 77},{x: 73,y: 80},{x: 68,y: 83},{x: 64,y: 85},{x: 57,y: 86},{x: 55,y: 86},{x: 55,y: 87},{x: 47,y: 89},{x: 46,y: 89},{x: 46,y: 89},{x: 43,y: 90},{x: 41,y: 90},{x: 38,y: 91},{x: 34,y: 91},{x: 34,y: 91},{x: 33,y: 91},{x: 32,y: 93},{x: 30,y: 93},{x: 29,y: 93},{x: 29,y: 95},{x: 27,y: 95},{x: 23,y: 95},{x: 23,y: 95},{x: 22,y: 96},{x: 20,y: 96},{x: 19,y: 96},{x: 19,y: 96},{x: 17,y: 96},{x: 17,y: 96},{x: 16,y: 96},{x: 12,y: 96},{x: 12,y: 97},{x: 11,y: 97},{x: 9,y: 97},{x: 7,y: 97},{x: 6,y: 97},{x: 6,y: 97},{x: 5,y: 99},{x: 3,y: 99},{x: 2,y: 99},{x: 0,y: 99},{x: 0,y: 99},{x: 0,y: 100}],
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
    console.info(`Gesture ${result[0].gesture} "${this.getGestureName(result[0].gesture)}" was recognized`, result);
    // todo bei reversed coord: warum p gleich?
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
