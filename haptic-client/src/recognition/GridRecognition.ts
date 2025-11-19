import cvModule from '@techstark/opencv-js';

const MINIMAL_POSSIBLE_AREA = 80000;
const MAX_POSSIBLE_AREA_RATIO = 0.9;
const DEBUG = true;

export class GridRecognition {
  private cv: cvModule.CV | null = null;
  private cap: cvModule.VideoCapture | null = null;
  private src: cvModule.Mat | null = null;
  private gray: cvModule.Mat | null = null;

  /**
   * Lädt OpenCV und initialisiert die GridRecognition
   */
  async initialize(): Promise<void> {
    this.cv = await this.getOpenCv();
    console.log('OpenCV.js is ready!');
    console.log(this.cv.getBuildInformation());
    console.log('GridRecognition initialized');
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

  processFrame(outputCanvas2: HTMLCanvasElement, outputCanvas3: HTMLCanvasElement | null): void {
    if (!this.cv || !this.cap || !this.src || !this.gray) {
      return;
    }

    this.cap.read(this.src);

    // Verwende die verbesserte Vorverarbeitung
    const processed = this.preprocessImage(this.src);
    const { contour, area } = this.expandContourSearch(processed);

    // Visualisierung der Kantenerkennung
    const edgesVis = processed.clone();
    this.cv.cvtColor(edgesVis, edgesVis, this.cv.COLOR_GRAY2RGBA);

    if (contour && area > MINIMAL_POSSIBLE_AREA) {
      if (DEBUG) console.log(`Grid gefunden! Area: ${area}`);

      // Zeichne die erkannte Kontur in Grün
      const vec = new this.cv.MatVector();
      vec.push_back(contour);
      this.cv.drawContours(edgesVis, vec, -1, new this.cv.Scalar(0, 255, 0, 255), 3);

      // Zeichne Eckpunkte in Rot mit Nummerierung
      for (let i = 0; i < 4; i++) {
        const x = contour.data32S[i * 2];
        const y = contour.data32S[i * 2 + 1];
        this.cv.circle(edgesVis, new this.cv.Point(x, y), 8, new this.cv.Scalar(255, 0, 0, 255), -1);
        this.cv.putText(
          edgesVis,
          `${i}`,
          new this.cv.Point(x + 10, y - 10),
          this.cv.FONT_HERSHEY_SIMPLEX,
          0.6,
          new this.cv.Scalar(255, 255, 0, 255),
          2,
        );
      }

      vec.delete();

      // Wende perspektivische Transformation an
      const warped = this.warpPerspective(this.src, contour);

      if (warped && outputCanvas3) {
        this.cv.imshow(outputCanvas3, warped);
        warped.delete();
      }

      contour.delete();
    } else {
      if (DEBUG && area > 0) console.log(`Kein Grid gefunden. Area: ${area}`);
    }

    this.cv.imshow(outputCanvas2, edgesVis);
    edgesVis.delete();
    processed.delete();
  }

  private preprocessImage(src: cvModule.Mat): cvModule.Mat {
    if (!this.cv) throw new Error('OpenCV not initialized');

    const gray = new this.cv.Mat();
    const blurred = new this.cv.Mat();
    const edges = new this.cv.Mat();

    // 1. Graustufen
    this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY);

    // 2. Gaussian Blur (bilateral ist unnötig teuer + unruhig)
    this.cv.GaussianBlur(gray, blurred, new this.cv.Size(5, 5), 0);

    // 3. Canny
    this.cv.Canny(blurred, edges, 80, 160);

    gray.delete();
    blurred.delete();

    return edges;
  }

  private getMaxContour(image: cvModule.Mat): { contour: cvModule.Mat | null; area: number } {
    if (!this.cv) throw new Error('OpenCV not initialized');

    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();

    this.cv.findContours(image, contours, hierarchy, this.cv.RETR_EXTERNAL, this.cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContour: cvModule.Mat | null = null;
    const imageArea = image.rows * image.cols;
    const maxAllowedArea = imageArea * MAX_POSSIBLE_AREA_RATIO;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = this.cv.contourArea(cnt);

      if (area < MINIMAL_POSSIBLE_AREA || area > maxAllowedArea) {
        continue;
      }

      const perimeter = this.cv.arcLength(cnt, true);
      const approx = new this.cv.Mat();
      const epsilon = 0.02 * perimeter;
      this.cv.approxPolyDP(cnt, approx, epsilon, true);

      if (approx.rows === 4) {
        if (this.cv.isContourConvex(approx)) {
          const rect = this.cv.boundingRect(approx);
          const aspectRatio = rect.width / rect.height;

          if (aspectRatio > 0.3 && aspectRatio < 3.0) {
            if (area > maxArea) {
              maxArea = area;
              if (maxContour) maxContour.delete();
              maxContour = approx.clone();
            }
          }
        }
      }

      approx.delete();
    }

    hierarchy.delete();
    contours.delete();

    return { contour: maxContour, area: maxArea };
  }

  private expandContourSearch(gray: cvModule.Mat): { contour: cvModule.Mat | null; area: number } {
    if (!this.cv) throw new Error('OpenCV not initialized');

    let { contour, area } = this.getMaxContour(gray);

    const MAX_DILATE_ITERATIONS = 5;
    const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(5, 5));

    let dilateIterations = 0;
    const temp = new this.cv.Mat();

    while (area < MINIMAL_POSSIBLE_AREA && dilateIterations < MAX_DILATE_ITERATIONS) {
      dilateIterations++;

      this.cv.dilate(gray, temp, kernel, new this.cv.Point(-1, -1), 1, this.cv.BORDER_CONSTANT);
      temp.copyTo(gray);

      const result = this.getMaxContour(gray);
      if (result.contour) {
        if (contour) contour.delete();
        contour = result.contour;
      }
      area = result.area;

      // if (DEBUG) console.log(`Dilate step ${dilateIterations}, area = ${area}`);
    }

    temp.delete();
    kernel.delete();

    return { contour, area };
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

  private warpPerspective(src: cvModule.Mat, contour: cvModule.Mat): cvModule.Mat | null {
    if (!this.cv) throw new Error('OpenCV not initialized');

    if (contour.rows !== 4) {
      return null;
    }

    // Extrahiere die 4 Eckpunkte
    const points: number[][] = [];
    for (let i = 0; i < 4; i++) {
      points.push([contour.data32S[i * 2], contour.data32S[i * 2 + 1]]);
    }

    const ordered = this.orderPoints(points);

    // Berechne Dimensionen
    const widthA = Math.hypot(ordered[2][0] - ordered[3][0], ordered[2][1] - ordered[3][1]);
    const widthB = Math.hypot(ordered[1][0] - ordered[0][0], ordered[1][1] - ordered[0][1]);
    const maxWidth = Math.max(widthA, widthB);

    const heightA = Math.hypot(ordered[1][0] - ordered[2][0], ordered[1][1] - ordered[2][1]);
    const heightB = Math.hypot(ordered[0][0] - ordered[3][0], ordered[0][1] - ordered[3][1]);
    const maxHeight = Math.max(heightA, heightB);

    // Ziel-Punkte für das begradiate Bild
    const dst = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [
      0,
      0,
      maxWidth - 1,
      0,
      maxWidth - 1,
      maxHeight - 1,
      0,
      maxHeight - 1,
    ]);

    const srcPts = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, ordered.flat());

    // Berechne Perspektivtransformation
    const M = this.cv.getPerspectiveTransform(srcPts, dst);
    const warped = new this.cv.Mat();

    this.cv.warpPerspective(
      src,
      warped,
      M,
      new this.cv.Size(maxWidth, maxHeight),
      this.cv.INTER_LINEAR,
      this.cv.BORDER_CONSTANT,
      new this.cv.Scalar(0, 0, 0, 255),
    );

    // Cleanup
    srcPts.delete();
    dst.delete();
    M.delete();

    return warped;
  }

  /** crop video w/ given corners and display outputCanvas */
  cropGridFromCorners(outputCanvas: HTMLCanvasElement, corners: { x: number; y: number }[], size: number = 400): void {
    if (!this.cv || !this.src) {
      throw new Error('OpenCV not initialized or video source not ready');
    }

    if (corners.length !== 4) {
      throw new Error('Exactly 4 corners are required');
    }

    // Sortiere die Ecken in der richtigen Reihenfolge (top-left, top-right, bottom-right, bottom-left)
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

    // Zeige das Ergebnis auf dem Canvas
    this.cv.imshow(outputCanvas, warped);

    // Cleanup
    srcPts.delete();
    dst.delete();
    M.delete();
    warped.delete();
  }
}
