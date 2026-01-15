import cvModule from '@techstark/opencv-js';
import { Corner } from 'js-aruco2';
import { Coord } from '../shared/models';
import { AVAILABLE_CELL_MARKERS, BOARD_SIZE, MARKER_ROLE } from '../config';

export class ImageProcessor {
  private cv: cvModule.CV | null = null;
  private cap: cvModule.VideoCapture | null = null;
  private src: cvModule.Mat | null = null;
  private gray: cvModule.Mat | null = null;

  /**
   * Lädt OpenCV und initialisiert die GridRecognition
   */
  async initialize(): Promise<void> {
    this.cv = await this.getOpenCv();
    console.log(this.cv.getBuildInformation());
  }

  /**
   * Hilfsfunktion zum Laden von OpenCV
   */
  private async getOpenCv(): Promise<cvModule.CV> {
    let cv;
    if (cvModule instanceof Promise) {
      cv = await cvModule;
    } else {
      await new Promise<void>((resolve) => {
        cvModule.onRuntimeInitialized = () => resolve();
      });
      cv = cvModule;
    }
    return cv;
  }

  setupForVideo(video: HTMLVideoElement, videoWidth: number, videoHeight: number): void {
    if (!this.cv) {
      throw new Error('OpenCV not initialized');
    }

    this.cap = new this.cv.VideoCapture(video);
    this.src = new this.cv.Mat(videoHeight, videoWidth, this.cv.CV_8UC4);
    this.gray = new this.cv.Mat(videoHeight, videoWidth, this.cv.CV_8UC1);
  }

  isReady(): boolean {
    return !!this.cv && !!this.cap && !!this.src && !!this.gray;
  }

  /** enhance video image for aruco marker detection */
  prepareForArucoDetection(outputCanvas: HTMLCanvasElement, frameCounter: number): void {
    if (!this.cv || !this.cap || !this.src) {
      return;
    }

    this.cap.read(this.src);

    const gray = new this.cv.Mat();
    const enhanced = new this.cv.Mat();

    try {
      // grayscale
      this.cv.cvtColor(this.src, gray, this.cv.COLOR_RGBA2GRAY);

      // slight smoothing
      this.cv.medianBlur(gray, gray, 3);

      // CLAHE with varying clipLimit based on frameCounter
      const clipLimit = 2.0 + Math.sin(frameCounter * 0.3) * 2.0;
      const clahe = new this.cv.CLAHE(clipLimit, new this.cv.Size(8, 8));
      clahe.apply(gray, enhanced);

      // gamma correctur based on frameCounter
      const gamma = 1.0 + Math.sin(frameCounter * 0.25) * 0.15; // 0.85–1.15
      const lookUpTable = new this.cv.Mat(1, 256, this.cv.CV_8U);
      for (let i = 0; i < 256; i++) {
        lookUpTable.data[i] = Math.min(255, Math.max(0, 255 * Math.pow(i / 255, gamma)));
      }
      this.cv.LUT(enhanced, lookUpTable, enhanced);
      lookUpTable.delete();

      // adaptive threshold based on frameCounter
      // const C = 2 + Math.sin(frameCounter * 0.3) * 1;
      // this.cv.adaptiveThreshold(enhanced, enhanced, 255, this.cv.ADAPTIVE_THRESH_GAUSSIAN_C, this.cv.THRESH_BINARY, 11, C);

      this.cv.imshow(outputCanvas, enhanced);

      clahe.delete();
    } finally {
      gray.delete();
      enhanced.delete();
    }
  }

  private orderPoints(pts: number[][]): number[][] {
    const sums = pts.map((p) => p[0] + p[1]);
    const topLeft = pts[sums.indexOf(Math.min(...sums))];
    const bottomRight = pts[sums.indexOf(Math.max(...sums))];

    const diffs = pts.map((p) => p[0] - p[1]);
    const topRight = pts[diffs.indexOf(Math.max(...diffs))];
    const bottomLeft = pts[diffs.indexOf(Math.min(...diffs))];

    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  /**
   * crop video w/ given corners and display outputCanvas; crop all cells
   * @returns array of cropped cells
   */
  cropGridFromCorners(
    outputCanvas: HTMLCanvasElement,
    corners: { x: number; y: number }[],
    frameCounter: number,
    size: number = 400,
  ): cvModule.Mat[] {
    if (!this.cv || !this.src || corners.length !== 4) {
      return [];
    }

    const points = corners.map((c) => [c.x, c.y]);
    const ordered = this.orderPoints(points);
    const srcPts = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, ordered.flat());
    const dst = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [0, 0, size - 1, 0, size - 1, size - 1, 0, size - 1]);
    const M = this.cv.getPerspectiveTransform(srcPts, dst);
    const warped = new this.cv.Mat();

    // perspective transform
    this.cv.warpPerspective(
      this.src,
      warped,
      M,
      new this.cv.Size(size, size),
      this.cv.INTER_LINEAR,
      this.cv.BORDER_CONSTANT,
      new this.cv.Scalar(0, 0, 0, 255),
    );

    // split the grid
    const cellSize = size / BOARD_SIZE;
    const cells: cvModule.Mat[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = c * cellSize;
        const y = r * cellSize;
        const roi = warped.roi(new this.cv.Rect(x, y, cellSize, cellSize));
        cells.push(roi.clone()); // clone!
        roi.delete();
      }
    }

    // display frame number
    this.cv.putText(
      warped,
      '' + frameCounter,
      new this.cv.Point(8, 24),
      this.cv.FONT_HERSHEY_PLAIN,
      1.6,
      new this.cv.Scalar(0, 255, 0, 255),
      2,
      this.cv.LINE_AA,
    ); // todo helper methode

    this.cv.imshow(outputCanvas, warped);

    srcPts.delete();
    dst.delete();
    M.delete();
    warped.delete();

    return cells;
  }

  /**
   * Calculate the grid Coords of a px coordinate using perspective transform
   * @param coord - the px Coord from the video frame
   * @param corners - the Corners of the grid in the video frame
   * @returns the Coord
   */
  videoPxToGridCoord(coord: Coord, corners: Corner[]): Coord {
    if (!this.cv || corners.length !== 4) {
      return { x: -1, y: -1 };
    }

    const points = corners.map((c) => [c.x, c.y]);
    const ordered = this.orderPoints(points);

    const srcPts = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, ordered.flat());
    const dst = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [
      0,
      0,
      BOARD_SIZE,
      0,
      BOARD_SIZE,
      BOARD_SIZE,
      0,
      BOARD_SIZE,
    ]);
    const M = this.cv.getPerspectiveTransform(srcPts, dst);

    const srcPoint = this.cv.matFromArray(1, 1, this.cv.CV_32FC2, [coord.x, coord.y]);
    const dstPoint = new this.cv.Mat();
    this.cv.perspectiveTransform(srcPoint, dstPoint, M);

    const x = dstPoint.data32F[0];
    const y = dstPoint.data32F[1];

    srcPts.delete();
    dst.delete();
    srcPoint.delete();
    dstPoint.delete();
    M.delete();

    return {
      x: Math.max(0, Math.min(BOARD_SIZE - 1, Math.floor(x))),
      y: Math.max(0, Math.min(BOARD_SIZE - 1, Math.floor(y))),
    };
  }

  /**
   * detect markers by evaluating colors
   * @param array of cropped cells
   * @returns array with the roles of detected markers
   */
  detectMarkersByHSV(cells: cvModule.Mat[]): (MARKER_ROLE | undefined)[] {
    if (!this.cv) {
      return [];
    }

    const result = [];
    const mask = new this.cv.Mat();

    for (let i = 0; i < cells.length; i++) {
      // skip white cells
      const mean = this.cv.mean(cells[i]);
      if (mean[0] > 240 && mean[1] > 240 && mean[2] > 240) {
        // todo werte testen
        result.push(undefined);
        continue;
      }

      const hsv = new this.cv.Mat();
      this.cv.cvtColor(cells[i], hsv, this.cv.COLOR_RGB2HSV);

      let detected: MARKER_ROLE | undefined;
      const pixelThreshold = cells[i].rows * cells[i].cols * 0.05;

      // check for all markers
      for (const marker of AVAILABLE_CELL_MARKERS) {
        const lower = new this.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [...marker.lowerHSV, 0]);
        const upper = new this.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [...marker.upperHSV, 255]);

        this.cv.inRange(hsv, lower, upper, mask);
        const count = this.cv.countNonZero(mask);

        lower.delete();
        upper.delete();

        if (count >= pixelThreshold) {
          detected = marker.role;
          break;
        }
      }

      result.push(detected);
      hsv.delete();
    }

    mask.delete();
    return result;
  }
}
