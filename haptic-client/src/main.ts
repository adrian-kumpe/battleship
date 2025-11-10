import { DrawingUtils, FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import cvModule from '@techstark/opencv-js';

type RunningMode = 'IMAGE' | 'VIDEO';

// grid recognition
const MINIMAL_POSSIBLE_AREA = 120000; // anpassen nach Bedarf
const DEBUG = false;
let cv: cvModule.CV;
const outputCanvas2 = document.getElementById('output_canvas2') as HTMLCanvasElement;

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

  cv.findContours(image, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let maxArea = 0;
  let maxContour: cvModule.Mat | null = null;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);

    const perimeter = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.1 * perimeter, true);

    const moments = cv.moments(approx, false);
    const area = moments.m00;

    if (approx.rows === 4 && area > maxArea) {
      maxArea = area;
      maxContour = approx.clone(); // wichtig: nicht ref übernehmen
    }

    approx.delete();
  }

  hierarchy.delete();
  contours.delete();

  return { contour: maxContour, area: maxArea };
}

function expandContourSearch(gray: cvModule.Mat): { contour: cvModule.Mat | null; area: number } {
  let { contour, area } = getMaxContour(gray);

  const MAX_DILATE_ITERATIONS = 3;
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));

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
    contour = result.contour;
    area = result.area;

    if (DEBUG) console.log(`Dilate step ${dilateIterations}, area = ${area}`);
  }

  temp.delete();
  kernel.delete();

  return { contour, area };
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

  // todo das muss woanders hin
  if (cv && cap && src && gray) {
    cap.read(src);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, gray, 60, 140);

    const { contour, area } = expandContourSearch(gray);

    if (contour && area > MINIMAL_POSSIBLE_AREA) {
      const vec = new cv.MatVector();
      vec.push_back(contour);
      cv.drawContours(gray, vec, -1, new cv.Scalar(255, 0, 0, 255), cv.FILLED);
      vec.delete();
    }

    cv.imshow(outputCanvas2, gray);
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
