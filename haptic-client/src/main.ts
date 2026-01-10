import { ClientToServerEvents, Coord, ReportMode, ServerToClientEvents, ShipPlacement } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { ImageProcessor } from './recognition/ImageProcessor';
import { ArucoRecognition } from './recognition/ArucoRecognition';
import { GameManager } from './game/GameManager';
import { getMarkerCenter, getMiddleCorners, getShipPlacement } from './utils';
import { AVAILABLE_MARKERS, MARKER_ROLE, VIDEO_WIDTH, VIDEO_HEIGHT } from './config';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Radio } from './elements/Radio';
import { Marker } from 'js-aruco2';

const gestureProgressBar = document.getElementById('gesture_progress_bar') as HTMLDivElement;
const confirmedGesture = document.getElementById('confirmed_gesture') as HTMLSpanElement;
/** gesture recognition w/ MediaPipe */
const gestureRecognition = new GestureRecognition(gestureProgressBar, confirmedGesture);
/** image transformation and cropping w/ OpenCV.js */
const imageProcessor = new ImageProcessor();
/** ArUco marker recognition w/ js-aruco2 */
const arucoRecognition = new ArucoRecognition();

const text_output = document.getElementById('text_output') as HTMLPreElement;
const text_output_wrapper = document.getElementById('text_output_wrapper') as HTMLDivElement;
export const radio = new Radio(text_output, text_output_wrapper);
radio.sendMessage('das sit ein test');

const prepareForArucoDetection = document.getElementById('prepareForArucoDetection') as HTMLCanvasElement;
const croppedLeftGrid = document.getElementById('croppedLeftGrid') as HTMLCanvasElement;
const croppedRightGrid = document.getElementById('croppedRightGrid') as HTMLCanvasElement;

let webcamRunning: Boolean = false;
let frameCounter: number = 0;

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

/** gameplay and server communication; socket needed */
const gameManager = new GameManager();

(async () => {
  await imageProcessor.initialize();
  await gestureRecognition.initialize();
})();

const video = document.getElementById('webcam') as HTMLVideoElement;
const recognizedGestures = document.getElementById('recognizedGestures') as HTMLCanvasElement;

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

let enableWebcamButton: HTMLButtonElement;
// If webcam supported, add event listener to button for when user wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById('enableCamera') as HTMLButtonElement;
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}
document.getElementById('useDemo')?.addEventListener('click', useDemo);

function enableCam() {
  enableWebcamButton.innerText = (webcamRunning = !webcamRunning) ? 'DISABLE PREDICTIONS' : 'ENABLE PREDICTIONS';

  const constraints = {
    video: {
      width: { ideal: VIDEO_WIDTH },
      height: { ideal: VIDEO_HEIGHT },
      frameRate: { ideal: 30, max: 30 },
    },
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    activateVideoStream(stream);
  });
  setupRecognition();
}

function useDemo() {
  webcamRunning = true;
  const img = new Image();
  img.src = '/sample1440x1080.png';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(30);
    activateVideoStream(stream);
  };
  setupRecognition();
}

function setupRecognition() {
  video.addEventListener('loadedmetadata', () => {
    imageProcessor.setupForVideo(video, VIDEO_WIDTH, VIDEO_HEIGHT);
    recognizedGestures.width = prepareForArucoDetection.width = VIDEO_WIDTH;
    recognizedGestures.height = prepareForArucoDetection.height = VIDEO_HEIGHT;
    croppedLeftGrid.width = croppedLeftGrid.height = croppedRightGrid.height = croppedRightGrid.width = 400;
  });
}

function activateVideoStream(stream: MediaStream) {
  video.srcObject = stream;
  video.width = VIDEO_WIDTH;
  video.height = VIDEO_HEIGHT;
  video.addEventListener('loadeddata', predictWebcam);
}

async function predictWebcam() {
  if (!gestureRecognition.isReady() || !imageProcessor.isReady()) {
    return;
  }

  frameCounter++;

  // detect gesture
  const gestureResult = await gestureRecognition.processFrame(video, recognizedGestures);

  // detect ArUco markers
  imageProcessor.prepareForArucoDetection(prepareForArucoDetection, frameCounter);
  const markers = arucoRecognition.processFrame(prepareForArucoDetection, frameCounter);

  // crop grids
  const markersLeftGrid = AVAILABLE_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_LEFT_GRID);
  const markersRightGrid = AVAILABLE_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_RIGHT_GRID);
  const leftGrid = markers.filter((m) => markersLeftGrid.some((s) => s.id === m.id));
  const rightGrid = markers.filter((m) => markersRightGrid.some((s) => s.id === m.id));

  // crop left grid
  if (leftGrid.length === 4) {
    const leftGridCorners: Coord[] = getMiddleCorners(leftGrid);
    imageProcessor.cropGridFromCorners(croppedLeftGrid, leftGridCorners, 400);

    // detect shipPlacement if needed
    if (gameManager.shouldUpdateShipPlacement()) {
      const shipPlacement = detectShipPlacement(markers, leftGridCorners);
      gameManager.updateShipPlacement(shipPlacement);
    }

    // todo1 validieren ob marker auf dem eigenen grid richtig platziert wurden
  }

  // crop right grid
  if (rightGrid.length === 4) {
    const rightGridCorners: Coord[] = getMiddleCorners(rightGrid);
    imageProcessor.cropGridFromCorners(croppedRightGrid, rightGridCorners, 400);

    // TODo1 hier müssen die marker validiert werden
  }

  // handle gestures
  // todo das muss nur passieren, wenn die geste länger als 3sek gehalten wurde
  if (gestureResult) {
    gameManager.handleGesture(gestureResult.name, gestureResult.indexTipPx);
    radio.sendMessage(
      'Geste ' + gestureResult.name + ' wurde erkannt und zeigt auf ' + gestureResult.indexTipPx?.toString() + '.',
    );
  }

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

/** detect the shipPlacement todo cache */
function detectShipPlacement(markers: Marker[], grid: Coord[]): ShipPlacement {
  const shipPlacement: ShipPlacement = [];
  //todo hier muss wegen überdeckung gecached werden

  [MARKER_ROLE.SHIP1, MARKER_ROLE.SHIP2].forEach((r) => {
    const ship = markers
      .filter((m) => AVAILABLE_MARKERS.filter((a) => a.role === r).some((s) => s.id === m.id))
      .map((s) => imageProcessor.videoPxToGridCoord(getMarkerCenter(s), grid));
    shipPlacement.push(...getShipPlacement(ship));
  });

  return shipPlacement;
}

/** detect markers */
function detectMarkers() {
  // todo
}
