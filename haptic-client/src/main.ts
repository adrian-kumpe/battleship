import { DrawingUtils, FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import cvModule from '@techstark/opencv-js';

let cv: cvModule.CV;
const outputCanvas2 = document.getElementById('output_canvas2') as HTMLCanvasElement;
// const outputCtx2 = outputCanvas2.getContext('2d');
// -
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

// --------------------

type RunningMode = 'IMAGE' | 'VIDEO';

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
  enableWebcamButton = <HTMLButtonElement>document.getElementById('webcamButton');
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

let lastVideoTime = -1;
let results: GestureRecognizerResult | undefined = undefined;
async function predictWebcam() {
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
    // 1) Aktuelles Video-Frame holen
    cap.read(src);

    // 2) Beispiel: Graustufen
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 3) In Canvas anzeigen
    cv.imshow(outputCanvas2, gray);
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
