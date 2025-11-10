import { DrawingUtils, FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import cvModule from '@techstark/opencv-js';

type RunningMode = 'IMAGE' | 'VIDEO';

// grid recognition
const MINIMAL_POSSIBLE_AREA = 80000; // anpassen nach Bedarf
const MAX_POSSIBLE_AREA_RATIO = 0.9; // maximal 90% des Bildes
const DEBUG = true;
let cv: cvModule.CV;
const outputCanvas2 = document.getElementById('output_canvas2') as HTMLCanvasElement;
const outputCanvas3 = document.getElementById('output_canvas3') as HTMLCanvasElement;

// gesture recognition
let gestureRecognizer: GestureRecognizer;
let runningMode = 'IMAGE';
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
const videoHeight = 360;
const videoWidth = 480;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:3000',
  // 'https://battleship-server-4725bfddd6bf.herokuapp.com',
  {
    transports: ['websocket'],
    query: {
      mode: 'manualReporting' as ReportMode,
    },
  },
);

async function getOpenCv() {
  let cv;
  if (cvModule instanceof Promise) {
    cv = await cvModule;
  } else {
    await new Promise<void>((resolve) => {
      cvModule.onRuntimeInitialized = () => resolve();
    });
    cv = cvModule;
  }
  return { cv };
}

const initOpenCV = async () => {
  cv = (await getOpenCv()).cv;
  console.log('OpenCV.js is ready!');
  // You can now use OpenCV functions here
  console.log(cv.getBuildInformation());
  video.addEventListener('play', setupOpenCVForVideo);
};
initOpenCV();

let cap: cvModule.VideoCapture;
let src: cvModule.Mat;
let gray: cvModule.Mat;

function setupOpenCVForVideo(): void {
  cap = new cv.VideoCapture(video);
  src = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
  gray = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);

  outputCanvas2.width = videoWidth;
  outputCanvas2.height = videoHeight;

  if (outputCanvas3) {
    outputCanvas3.width = videoWidth;
    outputCanvas3.height = videoHeight;
  }
}

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: runningMode as RunningMode,
  });
};
createGestureRecognizer();

const video = document.getElementById('webcam') as HTMLVideoElement;
console.log(video);
const canvasElement = document.getElementById('output_canvas') as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
const gestureOutput = document.getElementById('gesture_output') as HTMLParagraphElement;

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById('webcamButton') as HTMLButtonElement;
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

/** init cam when mediapipe and opencv are ready */
function enableCam() {
  if (!gestureRecognizer) {
    alert('Please wait for gestureRecognizer to load');
    return;
  }

  if (!cv) {
    alert('todo');
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = 'ENABLE PREDICTIONS';
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = 'DISABLE PREDICTIONS';
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
}

function getMaxContour(image: cvModule.Mat): { contour: cvModule.Mat | null; area: number } {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(image, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let maxArea = 0;
  let maxContour: cvModule.Mat | null = null;
  const imageArea = image.rows * image.cols;
  const maxAllowedArea = imageArea * MAX_POSSIBLE_AREA_RATIO;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);

    // Überspringe zu kleine oder zu große Konturen
    if (area < MINIMAL_POSSIBLE_AREA || area > maxAllowedArea) {
      continue;
    }

    const perimeter = cv.arcLength(cnt, true);
    const approx = new cv.Mat();

    // Adaptiver Epsilon-Wert für bessere Approximation
    const epsilon = 0.02 * perimeter;
    cv.approxPolyDP(cnt, approx, epsilon, true);

    // Prüfe ob es ein Viereck ist
    if (approx.rows === 4) {
      // Zusätzliche Validierung: Prüfe ob es konvex ist
      if (cv.isContourConvex(approx)) {
        // Berechne Aspekt-Ratio um zu schmale/breite Formen auszuschließen
        const rect = cv.boundingRect(approx);
        const aspectRatio = rect.width / rect.height;

        // Gitter sollte nicht zu extrem rechteckig sein (zwischen 0.3 und 3.0)
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

function expandContourSearch(gray: cvModule.Mat): { contour: cvModule.Mat | null; area: number } {
  let { contour, area } = getMaxContour(gray);

  const MAX_DILATE_ITERATIONS = 5;
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));

  let dilateIterations = 0;

  // Arbeitsspeicher-Temp-Mat
  const temp = new cv.Mat();

  while (area < MINIMAL_POSSIBLE_AREA && dilateIterations < MAX_DILATE_ITERATIONS) {
    dilateIterations++;

    // temp = dilate(gray)
    cv.dilate(gray, temp, kernel, new cv.Point(-1, -1), 1, cv.BORDER_CONSTANT);

    // jetzt wirklich überschreiben: gray ← temp, aber ohne delete
    temp.copyTo(gray);

    const result = getMaxContour(gray);
    if (result.contour) {
      if (contour) contour.delete();
      contour = result.contour;
    }
    area = result.area;

    if (DEBUG) console.log(`Dilate step ${dilateIterations}, area = ${area}`);
  }

  temp.delete();
  kernel.delete();

  return { contour, area };
}

/**
 * Verbesserte Bildvorverarbeitung für robuste Kantenerkennung
 */
function preprocessImage(src: cvModule.Mat): cvModule.Mat {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const dilated = new cv.Mat();
  const morphed = new cv.Mat();

  // 1. Zu Graustufen konvertieren
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // 2. Bilaterale Filter für Rauschunterdrückung bei Kantenerhaltung
  cv.bilateralFilter(gray, blurred, 9, 75, 75);

  // 3. Adaptive Schwellwertbildung für besseren Kontrast
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

  // 4. Morphologische Operationen um Lücken zu schließen
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);

  // 5. Canny Edge Detection mit optimierten Parametern
  cv.Canny(morphed, edges, 50, 150, 3, false);

  // 6. Leichte Dilatation um Lücken in Kanten zu schließen
  const dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
  cv.dilate(edges, dilated, dilateKernel);

  // Cleanup
  gray.delete();
  blurred.delete();
  edges.delete();
  thresh.delete();
  morphed.delete();
  kernel.delete();
  dilateKernel.delete();

  return dilated;
}

/**
 * Sortiert 4 Eckpunkte in der Reihenfolge: top-left, top-right, bottom-right, bottom-left
 */
function orderPoints(pts: number[][]): number[][] {
  // Summe: top-left hat kleinste, bottom-right hat größte
  const sums = pts.map((p) => p[0] + p[1]);
  const topLeft = pts[sums.indexOf(Math.min(...sums))];
  const bottomRight = pts[sums.indexOf(Math.max(...sums))];

  // Differenz: top-right hat kleinste (x-y), bottom-left hat größte
  const diffs = pts.map((p) => p[0] - p[1]);
  const topRight = pts[diffs.indexOf(Math.min(...diffs))];
  const bottomLeft = pts[diffs.indexOf(Math.max(...diffs))];

  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Wendet eine perspektivische Transformation an, um das Gitter zu croppen und zu begradigen
 */
function warpPerspective(src: cvModule.Mat, contour: cvModule.Mat): cvModule.Mat | null {
  if (contour.rows !== 4) {
    return null;
  }

  // Extrahiere die 4 Eckpunkte aus der Kontur
  const points: number[][] = [];
  for (let i = 0; i < 4; i++) {
    points.push([contour.data32S[i * 2], contour.data32S[i * 2 + 1]]);
  }

  // Sortiere Punkte in korrekter Reihenfolge
  const ordered = orderPoints(points);

  // Berechne Breite und Höhe des Zielbildes
  const widthA = Math.hypot(ordered[2][0] - ordered[3][0], ordered[2][1] - ordered[3][1]);
  const widthB = Math.hypot(ordered[1][0] - ordered[0][0], ordered[1][1] - ordered[0][1]);
  const maxWidth = Math.max(widthA, widthB);

  const heightA = Math.hypot(ordered[1][0] - ordered[2][0], ordered[1][1] - ordered[2][1]);
  const heightB = Math.hypot(ordered[0][0] - ordered[3][0], ordered[0][1] - ordered[3][1]);
  const maxHeight = Math.max(heightA, heightB);

  // Ziel-Punkte für das begradiate Bild
  const dst = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    maxWidth - 1,
    0,
    maxWidth - 1,
    maxHeight - 1,
    0,
    maxHeight - 1,
  ]);

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, ordered.flat());

  // Berechne Perspektivtransformation
  const M = cv.getPerspectiveTransform(srcPts, dst);
  const warped = new cv.Mat();

  cv.warpPerspective(
    src,
    warped,
    M,
    new cv.Size(maxWidth, maxHeight),
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(0, 0, 0, 255),
  );

  // Cleanup
  srcPts.delete();
  dst.delete();
  M.delete();

  return warped;
}

let lastVideoTime = -1;
let results: GestureRecognizerResult | undefined = undefined;
async function predictWebcam() {
  console.log('Camera resolution:', video.videoWidth, 'x', video.videoHeight);
  const webcamElement = document.getElementById('webcam') as HTMLVideoElement;
  // Now let's start detecting the stream.
  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
  }
  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = videoHeight + 'px';
  webcamElement.style.height = videoHeight + 'px';
  canvasElement.style.width = videoWidth + 'px';
  webcamElement.style.width = videoWidth + 'px';

  if (results && results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 5,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
    }
  }
  canvasCtx.restore();
  if (results && results.gestures.length > 0) {
    gestureOutput.style.display = 'block';
    gestureOutput.style.width = videoWidth + 'px';
    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat('' + results.gestures[0][0].score * 100).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;
    gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
  } else {
    gestureOutput.style.display = 'none';
  }

  // Grid-Erkennung mit verbesserter Kantenerkennung
  if (cv && cap && src && gray) {
    cap.read(src);

    // Verwende die verbesserte Vorverarbeitung
    const processed = preprocessImage(src);

    const { contour, area } = expandContourSearch(processed);

    // Visualisierung der Kantenerkennung
    const edgesVis = processed.clone();
    cv.cvtColor(edgesVis, edgesVis, cv.COLOR_GRAY2RGBA);

    if (contour && area > MINIMAL_POSSIBLE_AREA) {
      if (DEBUG) console.log(`Grid gefunden! Area: ${area}`);

      // Zeichne die erkannte Kontur in Grün
      const vec = new cv.MatVector();
      vec.push_back(contour);
      cv.drawContours(edgesVis, vec, -1, new cv.Scalar(0, 255, 0, 255), 3);

      // Zeichne Eckpunkte in Rot mit Nummerierung
      for (let i = 0; i < 4; i++) {
        const x = contour.data32S[i * 2];
        const y = contour.data32S[i * 2 + 1];
        cv.circle(edgesVis, new cv.Point(x, y), 8, new cv.Scalar(255, 0, 0, 255), -1);
        // Füge Text für Punkt-Nummer hinzu
        cv.putText(
          edgesVis,
          `${i}`,
          new cv.Point(x + 10, y - 10),
          cv.FONT_HERSHEY_SIMPLEX,
          0.6,
          new cv.Scalar(255, 255, 0, 255),
          2,
        );
      }

      vec.delete();

      // Wende perspektivische Transformation an, um das Gitter zu croppen
      const warped = warpPerspective(src, contour);

      if (warped && outputCanvas3) {
        // Zeige das gecroppte und begradiate Gitter
        cv.imshow(outputCanvas3, warped);
        warped.delete();
      }
    } else {
      if (DEBUG && area > 0) console.log(`Kein Grid gefunden. Area: ${area}`);
    }

    cv.imshow(outputCanvas2, edgesVis);
    edgesVis.delete();
    processed.delete();
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
