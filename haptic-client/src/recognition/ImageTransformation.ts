import cvModule from '@techstark/opencv-js';

export class ImageTransformation {
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
  prepareForArucoDetection(outputCanvas: HTMLCanvasElement): void {
    if (!this.cv || !this.cap || !this.src) {
      return;
    }

    this.cap.read(this.src);

    const gray = new this.cv.Mat();
    const enhanced = new this.cv.Mat();

    try {
      // 1) Graustufen
      this.cv.cvtColor(this.src, gray, this.cv.COLOR_RGBA2GRAY);

      // 2) Leichte Glättung
      // this.cv.GaussianBlur(gray, gray, new this.cv.Size(3, 3), 0);

      // 3) CLAHE (vor allem bei schlechten Lichtverhältnissen sinnvoll)
      const clahe = new this.cv.CLAHE(2.0, new this.cv.Size(8, 8));
      clahe.apply(gray, enhanced);

      // 4) Adaptive Threshold (nur wenn Erkennung schlecht ist!)
      // this.cv.adaptiveThreshold(
      //   enhanced,
      //   enhanced,
      //   255,
      //   this.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      //   this.cv.THRESH_BINARY,
      //   11,
      //   2,
      // );

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
    const topRight = pts[diffs.indexOf(Math.min(...diffs))];
    const bottomLeft = pts[diffs.indexOf(Math.max(...diffs))];

    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  /** crop video w/ given corners and display outputCanvas */
  cropGridFromCorners(outputCanvas: HTMLCanvasElement, corners: { x: number; y: number }[], size: number = 400): void {
    if (!this.cv || !this.src || corners.length !== 4) {
      return;
    }

    const points = corners.map((c) => [c.x, c.y]);
    const ordered = this.orderPoints(points);

    // Source-Punkte aus den geordneten Ecken
    const srcPts = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, ordered.flat());

    // Destination-Punkte für quadratisches Bild
    const dst = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [0, 0, size - 1, 0, size - 1, size - 1, 0, size - 1]);

    // Berechne Perspektivtransformation
    const M = this.cv.getPerspectiveTransform(srcPts, dst);
    const warped = new this.cv.Mat();

    // Wende Perspektivtransformation an
    this.cv.warpPerspective(
      this.src,
      warped,
      M,
      new this.cv.Size(size, size),
      this.cv.INTER_LINEAR,
      this.cv.BORDER_CONSTANT,
      new this.cv.Scalar(0, 0, 0, 255),
    );

    this.cv.imshow(outputCanvas, warped);

    srcPts.delete();
    dst.delete();
    M.delete();
    warped.delete();
  }
}
