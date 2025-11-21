import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { ImageTransformation } from './recognition/ImageTransformation';
import { ArucoRecognition } from './recognition/ArucoRecognition';
import { getMiddleCorners } from './utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

/**
 * desired video resolution width
 * @constant
 */
const VIDEO_WIDTH = 1440;
/**
 * desired video resolution height
 * @constant
 */
const VIDEO_HEIGHT = 1080;

/** gesture recognition w/ MediaPipe */
const gestureRecognition = new GestureRecognition();
/** image transformation and cropping w/ OpenCV.js */
const imageTransformation = new ImageTransformation();
/** ArUco marker recognition w/ js-aruco2 */
const arucoRecognition = new ArucoRecognition();

const prepareForArucoDetection = document.getElementById('prepareForArucoDetection') as HTMLCanvasElement;
const croppedLeftGrid = document.getElementById('croppedLeftGrid') as HTMLCanvasElement;
const croppedRightGrid = document.getElementById('croppedRightGrid') as HTMLCanvasElement;

let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;

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

(async () => {
  await imageTransformation.initialize();
  await gestureRecognition.initialize();
})();

const video = document.getElementById('webcam') as HTMLVideoElement;
const recognizedGestures = document.getElementById('recognizedGestures') as HTMLCanvasElement;
const gestureOutput = document.getElementById('gesture_output') as HTMLParagraphElement;

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
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
    imageTransformation.setupForVideo(video, VIDEO_WIDTH, VIDEO_HEIGHT);
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
  if (!gestureRecognition.isReady() || !imageTransformation.isReady()) {
    return;
  }

  await gestureRecognition.processFrame(video, recognizedGestures, gestureOutput);

  imageTransformation.prepareForArucoDetection(prepareForArucoDetection);

  const markers = arucoRecognition.processFrame(prepareForArucoDetection);

  const cropGrids = (markerIds: number[], croppedGridCanvas: HTMLCanvasElement) => {
    const grid = markers.filter((m) => markerIds.includes(m.id));
    if (grid.length === 4) {
      const gridCorners = getMiddleCorners(grid);
      imageTransformation.cropGridFromCorners(croppedGridCanvas, gridCorners, 400);
    }
  };
  cropGrids([3, 4, 6, 9], croppedLeftGrid);
  cropGrids([0, 5, 7, 8], croppedRightGrid);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
