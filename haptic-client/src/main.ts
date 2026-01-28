import { ClientToServerEvents, Coord, ReportMode, ServerToClientEvents, ShipPlacement } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { ImageProcessor } from './recognition/ImageProcessor';
import { ArucoRecognition } from './recognition/ArucoRecognition';
import { GameManager } from './components/GameManager';
import { getMarkerCenter, getMiddleCorners, getShipPlacement } from './utils';
import { AVAILABLE_ARUCO_MARKERS, MARKER_ROLE, VIDEO_WIDTH, VIDEO_HEIGHT } from './config';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Radio } from './components/Radio';
import { Marker } from 'js-aruco2';

/** display recognition progress of a gesture (time) */
const gestureProgressBar = document.getElementById('gesture_progress_bar') as HTMLDivElement;
/** ouput element for recognized gestures and information */
const confirmedGesture = document.getElementById('confirmed_gesture') as HTMLSpanElement;
/** gesture recognition w/ MediaPipe */
const gestureRecognition = new GestureRecognition(gestureProgressBar, confirmedGesture);

/** image transformation, cropping, ... w/ OpenCV.js */
const imageProcessor = new ImageProcessor();
/** ArUco marker recognition w/ js-aruco2 */
const arucoRecognition = new ArucoRecognition();

const text_output = document.getElementById('text_output') as HTMLPreElement;
const text_output_wrapper = document.getElementById('text_output_wrapper') as HTMLDivElement;
/** display text output */
export const radio = new Radio(text_output, text_output_wrapper);

/** canvas for ArUco recognition */
const prepareForArucoDetection = document.getElementById('prepareForArucoDetection') as HTMLCanvasElement;
/** canvas grid of player */
const croppedLeftGrid = document.getElementById('croppedLeftGrid') as HTMLCanvasElement;
/** canvas grid of opponent */
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

const gameManager = new GameManager(socket, radio);

(async () => {
  await imageProcessor.initialize();
  await gestureRecognition.initialize();
})();

/** input webcam video */
const video = document.getElementById('webcam') as HTMLVideoElement;
/** overlay canvas to display Mediapipe hand landmarks */
const recognizedGestures = document.getElementById('recognizedGestures') as HTMLCanvasElement;
// const recognizedGesturesFrameNumber = document.querySelector('#recognizedGestures + .frame-number') as HTMLDivElement; // todo entfernen

/** checks if webcam access is supported */
const hasGetUserMedia = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

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

/** main prediction loop */
async function predictWebcam() {
  if (!gestureRecognition.isReady() || !imageProcessor.isReady()) {
    return;
  }

  frameCounter++;

  // detect gesture
  const gestureResult = await gestureRecognition.processFrame(video, recognizedGestures);
  imageProcessor.drawFrameNumber(recognizedGestures, frameCounter);

  // detect ArUco markers
  imageProcessor.prepareForArucoDetection(prepareForArucoDetection, frameCounter);
  const markers = arucoRecognition.processFrame(prepareForArucoDetection, frameCounter);

  // crop grids
  const markersLeftGrid = AVAILABLE_ARUCO_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_LEFT_GRID);
  const markersRightGrid = AVAILABLE_ARUCO_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_RIGHT_GRID);
  const leftGrid = markers.filter((m) => markersLeftGrid.some((s) => s.id === m.id));
  const rightGrid = markers.filter((m) => markersRightGrid.some((s) => s.id === m.id));

  // crop left grid every 3 frames (+0) and if no hands are visible
  if (leftGrid.length === 4 && !(frameCounter % 3) && !gestureRecognition.landmarksVisible()) {
    const leftGridCorners: Coord[] = getMiddleCorners(leftGrid);
    const leftGridCells = imageProcessor.cropGridFromCorners(
      croppedLeftGrid,
      leftGridCorners,
      Math.floor(frameCounter / 3),
      400,
    );

    // detect shipPlacement if needed
    if (gameManager.shouldUpdateShipPlacement()) {
      const shipPlacement = detectShipPlacement(markers, leftGridCorners);
      gameManager.updateShipPlacement(shipPlacement);
    }

    // validate grid markers on the own grid if needed
    if (gameManager.shouldUpdateLeftGridMarkers()) {
      // detectGridMarker()
      const leftGridCellMarkers = imageProcessor.detectMarkersByHSV(leftGridCells);
      // hier validieren, ob neue marker dazu gekommen sind --> handle markers aufrufen
    }
  }

  // crop right grid every 3 frames (+1) and if no hands are visible
  if (rightGrid.length === 4 && !((frameCounter + 1) % 3) && !gestureRecognition.landmarksVisible()) {
    const rightGridCorners: Coord[] = getMiddleCorners(rightGrid);
    const rightGridCells = imageProcessor.cropGridFromCorners(
      croppedRightGrid,
      rightGridCorners,
      Math.floor((frameCounter + 1) / 3),
      400,
    );

    // validate grid markers on the own grid if needed
    if (gameManager.shouldUpdateRightGridMarkers()) {
      // detectGridMarker()
      const rightGridCellMarkers = imageProcessor.detectMarkersByHSV(rightGridCells);
    }
  }

  // handle gestures
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

  [
    MARKER_ROLE.SHIP1,
    MARKER_ROLE.SHIP2,
    MARKER_ROLE.SHIP3,
    MARKER_ROLE.SHIP4,
    MARKER_ROLE.SHIP5,
    MARKER_ROLE.SHIP6,
    MARKER_ROLE.SHIP7,
    MARKER_ROLE.SHIP8,
    MARKER_ROLE.SHIP9,
  ].forEach((r) => {
    const ship = markers
      .filter((m) => AVAILABLE_ARUCO_MARKERS.filter((a) => a.role === r).some((s) => s.id === m.id))
      .map((s) => imageProcessor.videoPxToGridCoord(getMarkerCenter(s), grid));
    shipPlacement.push(...getShipPlacement(ship));
  });

  return shipPlacement;
}

/** detect markers */
function detectGridMarker() {
  // todo
}
