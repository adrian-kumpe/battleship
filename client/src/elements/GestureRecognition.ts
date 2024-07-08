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
    coords: [{x: 458,y: 334},{x: 449,y: 334},{x: 441,y: 336},{x: 437,y: 336},{x: 428,y: 339},{x: 413,y: 345},{x: 398,y: 351},{x: 388,y: 360},{x: 371,y: 373},{x: 356,y: 388},{x: 334,y: 413},{x: 326,y: 432},{x: 317,y: 449},{x: 313,y: 464},{x: 307,y: 481},{x: 300,y: 500},{x: 294,y: 520},{x: 292,y: 534},{x: 290,y: 543},{x: 287,y: 556},{x: 287,y: 560},{x: 287,y: 562},{x: 287,y: 569},{x: 290,y: 577},{x: 296,y: 586},{x: 298,y: 590},{x: 309,y: 598},{x: 322,y: 607},{x: 334,y: 613},{x: 349,y: 622},{x: 353,y: 624},{x: 373,y: 628},{x: 392,y: 632},{x: 419,y: 632},{x: 445,y: 632},{x: 466,y: 632},{x: 492,y: 632},{x: 513,y: 632},{x: 537,y: 628},{x: 566,y: 628},{x: 579,y: 622},{x: 594,y: 620},{x: 605,y: 618},{x: 613,y: 613},{x: 618,y: 611},{x: 622,y: 607},{x: 628,y: 603},{x: 628,y: 590},{x: 630,y: 586},{x: 630,y: 583},{x: 630,y: 577},{x: 630,y: 569},{x: 630,y: 556},{x: 628,y: 541},{x: 624,y: 526},{x: 622,y: 511},{x: 620,y: 507},{x: 620,y: 496},{x: 613,y: 485},{x: 613,y: 483},{x: 609,y: 475},{x: 605,y: 466},{x: 603,y: 464},{x: 598,y: 460},{x: 592,y: 454},{x: 588,y: 451},{x: 581,y: 447},{x: 571,y: 441},{x: 569,y: 441},{x: 569,y: 437},{x: 562,y: 434},{x: 560,y: 432},{x: 556,y: 428},{x: 554,y: 426},{x: 551,y: 424},{x: 549,y: 424},{x: 547,y: 419},{x: 543,y: 417},{x: 543,y: 415},{x: 539,y: 411},{x: 534,y: 407},{x: 530,y: 400},{x: 526,y: 398},{x: 522,y: 390},{x: 520,y: 390},{x: 515,y: 383},{x: 511,y: 381},{x: 509,y: 377},{x: 507,y: 373},{x: 503,y: 368},{x: 498,y: 366},{x: 494,y: 362},{x: 492,y: 360},{x: 490,y: 356},{x: 485,y: 356},{x: 483,y: 353},{x: 483,y: 351},{x: 481,y: 349},{x: 479,y: 349},{x: 479,y: 347},{x: 475,y: 345},{x: 475,y: 345},{x: 475,y: 343},{x: 473,y: 341},{x: 466,y: 339},{x: 466,y: 336},{x: 466,y: 334},{x: 464,y: 334}],
  },
  {
    gesture: Gestures.ARROW_UP,
    // prettier-ignore
    coords: [{x: 268,y: 673},{x: 270,y: 673},{x: 270,y: 671},{x: 270,y: 671},{x: 270,y: 669},{x: 270,y: 662},{x: 273,y: 658},{x: 275,y: 656},{x: 277,y: 649},{x: 279,y: 643},{x: 283,y: 632},{x: 287,y: 620},{x: 287,y: 615},{x: 292,y: 603},{x: 298,y: 592},{x: 302,y: 581},{x: 309,y: 566},{x: 311,y: 562},{x: 315,y: 551},{x: 322,y: 534},{x: 330,y: 524},{x: 336,y: 509},{x: 341,y: 494},{x: 347,y: 483},{x: 356,y: 471},{x: 362,y: 458},{x: 366,y: 445},{x: 368,y: 439},{x: 375,y: 426},{x: 377,y: 422},{x: 381,y: 409},{x: 390,y: 394},{x: 394,y: 388},{x: 398,y: 377},{x: 402,y: 371},{x: 405,y: 373},{x: 407,y: 379},{x: 407,y: 381},{x: 409,y: 385},{x: 411,y: 394},{x: 411,y: 398},{x: 413,y: 402},{x: 413,y: 407},{x: 413,y: 415},{x: 413,y: 424},{x: 417,y: 432},{x: 417,y: 439},{x: 419,y: 445},{x: 422,y: 454},{x: 422,y: 458},{x: 424,y: 466},{x: 426,y: 475},{x: 430,y: 483},{x: 432,y: 492},{x: 434,y: 500},{x: 441,y: 509},{x: 449,y: 524},{x: 454,y: 534},{x: 460,y: 547},{x: 462,y: 551},{x: 466,y: 564},{x: 475,y: 579},{x: 483,y: 592},{x: 488,y: 603},{x: 496,y: 618},{x: 500,y: 624},{x: 503,y: 637},{x: 507,y: 643},{x: 509,y: 647},{x: 509,y: 652},{x: 511,y: 654},{x: 513,y: 660},{x: 515,y: 662},{x: 515,y: 664}],
  },
  {
    gesture: Gestures.ARROW_DOWN,
    // prettier-ignore
    coords: [{x: 347,y: 351},{x: 349,y: 356},{x: 351,y: 356},{x: 356,y: 362},{x: 358,y: 364},{x: 362,y: 366},{x: 368,y: 375},{x: 375,y: 381},{x: 383,y: 396},{x: 396,y: 407},{x: 398,y: 409},{x: 409,y: 419},{x: 419,y: 432},{x: 428,y: 441},{x: 439,y: 454},{x: 447,y: 466},{x: 458,y: 483},{x: 468,y: 496},{x: 477,y: 509},{x: 485,y: 517},{x: 485,y: 520},{x: 494,y: 532},{x: 503,y: 543},{x: 509,y: 554},{x: 517,y: 564},{x: 526,y: 577},{x: 532,y: 588},{x: 537,y: 594},{x: 541,y: 603},{x: 545,y: 607},{x: 547,y: 611},{x: 549,y: 613},{x: 551,y: 613},{x: 551,y: 615},{x: 551,y: 611},{x: 551,y: 605},{x: 551,y: 600},{x: 551,y: 594},{x: 551,y: 586},{x: 554,y: 577},{x: 556,y: 564},{x: 558,y: 551},{x: 560,y: 534},{x: 560,y: 530},{x: 562,y: 517},{x: 569,y: 505},{x: 569,y: 500},{x: 571,y: 488},{x: 575,y: 473},{x: 579,y: 458},{x: 586,y: 445},{x: 590,y: 430},{x: 596,y: 417},{x: 598,y: 413},{x: 603,y: 400},{x: 605,y: 390},{x: 611,y: 377},{x: 613,y: 364},{x: 613,y: 360},{x: 618,y: 351},{x: 620,y: 345},{x: 622,y: 334},{x: 626,y: 326},{x: 626,y: 322},{x: 628,y: 311},{x: 630,y: 304},{x: 635,y: 290},{x: 637,y: 287}],
  },
  {
    gesture: Gestures.ARROW_LEFT,
    // prettier-ignore
    coords: [{x: 594,y: 315},{x: 590,y: 317},{x: 586,y: 317},{x: 581,y: 319},{x: 575,y: 322},{x: 569,y: 324},{x: 556,y: 330},{x: 547,y: 332},{x: 537,y: 339},{x: 526,y: 347},{x: 511,y: 351},{x: 500,y: 358},{x: 494,y: 362},{x: 485,y: 366},{x: 475,y: 373},{x: 464,y: 379},{x: 458,y: 381},{x: 447,y: 388},{x: 432,y: 398},{x: 424,y: 400},{x: 413,y: 407},{x: 402,y: 413},{x: 390,y: 419},{x: 377,y: 424},{x: 366,y: 432},{x: 356,y: 437},{x: 347,y: 441},{x: 345,y: 443},{x: 336,y: 447},{x: 326,y: 454},{x: 322,y: 458},{x: 313,y: 460},{x: 307,y: 464},{x: 300,y: 468},{x: 298,y: 471},{x: 296,y: 473},{x: 298,y: 473},{x: 300,y: 473},{x: 304,y: 475},{x: 309,y: 475},{x: 315,y: 477},{x: 322,y: 481},{x: 326,y: 483},{x: 334,y: 485},{x: 345,y: 490},{x: 353,y: 492},{x: 368,y: 500},{x: 379,y: 507},{x: 390,y: 509},{x: 400,y: 517},{x: 415,y: 524},{x: 426,y: 528},{x: 441,y: 534},{x: 449,y: 541},{x: 462,y: 547},{x: 475,y: 554},{x: 479,y: 558},{x: 492,y: 562},{x: 503,y: 569},{x: 515,y: 573},{x: 528,y: 579},{x: 537,y: 586},{x: 551,y: 592},{x: 558,y: 594},{x: 573,y: 603},{x: 579,y: 607},{x: 586,y: 609},{x: 592,y: 611},{x: 603,y: 620},{x: 605,y: 620},{x: 609,y: 622},{x: 611,y: 624},{x: 615,y: 626}],
  },
  {
    gesture: Gestures.ARROW_RIGHT,
    // prettier-ignore
    coords: [{x: 407,y: 360},{x: 411,y: 364},{x: 419,y: 366},{x: 432,y: 375},{x: 437,y: 377},{x: 449,y: 381},{x: 464,y: 390},{x: 475,y: 398},{x: 492,y: 405},{x: 509,y: 413},{x: 526,y: 419},{x: 537,y: 424},{x: 551,y: 432},{x: 564,y: 439},{x: 569,y: 441},{x: 583,y: 445},{x: 594,y: 451},{x: 609,y: 458},{x: 624,y: 464},{x: 637,y: 471},{x: 641,y: 475},{x: 645,y: 475},{x: 654,y: 481},{x: 652,y: 483},{x: 645,y: 485},{x: 643,y: 488},{x: 637,y: 490},{x: 630,y: 494},{x: 624,y: 498},{x: 613,y: 500},{x: 605,y: 509},{x: 592,y: 515},{x: 583,y: 517},{x: 575,y: 522},{x: 562,y: 528},{x: 558,y: 528},{x: 543,y: 534},{x: 528,y: 539},{x: 517,y: 545},{x: 505,y: 549},{x: 492,y: 556},{x: 485,y: 558},{x: 479,y: 560},{x: 475,y: 564},{x: 468,y: 566},{x: 460,y: 569},{x: 449,y: 577},{x: 441,y: 579},{x: 432,y: 583},{x: 426,y: 586},{x: 415,y: 592},{x: 405,y: 596},{x: 390,y: 603},{x: 385,y: 605},{x: 381,y: 609},{x: 379,y: 609}],
  },
];

export class GestureRecognition {
  private distFunc = (a: Coord, b: Coord) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  constructor() {}

  public getGesture(gestureCoords: Coord[]): { gesture: Gestures; p: number } {
    const result: { gesture: Gestures; p: number }[] = [];
    gestureTemplate.forEach((gesture) => {
      const dtw = new DynamicTimeWarping(this.normalize(gesture.coords), this.normalize(gestureCoords), this.distFunc);
      result.push({ gesture: gesture.gesture, p: dtw.getDistance() });
    });
    result.sort((a: { gesture: Gestures; p: number }, b: { gesture: Gestures; p: number }) => {
      return a.p - b.p;
    });
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

export default class DynamicTimeWarping {
  // todo nicht optimal
  // todo quelle angeben?
  private ser1: any;
  private ser2: any;
  private distFunc: any;
  private distance: any;
  private matrix: any;

  /**
   * @see {@link https://github.com/GordonLesti/dynamic-time-warping/issues/4 source of code}
   */
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
