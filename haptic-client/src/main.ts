import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { ImageTransformation } from './recognition/ImageTransformation';
import { ArucoRecognition } from './recognition/ArucoRecognition';
import { Marker } from 'js-aruco2';
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
/** grid recognition and cropping w/ OpenCV.js */
const gridRecognition = new ImageTransformation();
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
  await gridRecognition.initialize();
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
    video.width = VIDEO_WIDTH;
    video.height = VIDEO_HEIGHT;
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
  video.addEventListener('loadedmetadata', () => {
    gridRecognition.setupForVideo(video, VIDEO_WIDTH, VIDEO_HEIGHT);
    recognizedGestures.width = prepareForArucoDetection.width = VIDEO_WIDTH;
    recognizedGestures.height = prepareForArucoDetection.height = VIDEO_HEIGHT;
    croppedLeftGrid.width = croppedLeftGrid.height = croppedRightGrid.height = croppedRightGrid.width = 400;
  });
}

function getMiddleCorners(grid: Marker[]): { x: number; y: number }[] {
  const leftGridCenter = {
    x:
      grid.reduce((sum, m) => {
        const markerCenterX = m.corners.reduce((s, c) => s + c.x, 0) / m.corners.length;
        return sum + markerCenterX;
      }, 0) / 4,
    y:
      grid.reduce((sum, m) => {
        const markerCenterY = m.corners.reduce((s, c) => s + c.y, 0) / m.corners.length;
        return sum + markerCenterY;
      }, 0) / 4,
  };
  return grid.map((m) => {
    // corner closest to the center of leftGrid
    let closestCorner = m.corners[0];
    let minDistance = Math.hypot(closestCorner.x - leftGridCenter.x, closestCorner.y - leftGridCenter.y);
    for (let i = 1; i < m.corners.length; i++) {
      const distance = Math.hypot(m.corners[i].x - leftGridCenter.x, m.corners[i].y - leftGridCenter.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestCorner = m.corners[i];
      }
    }
    return { x: closestCorner.x, y: closestCorner.y };
  });
}

async function predictWebcam() {
  if (!gestureRecognition.isReady() || !gridRecognition.isReady()) {
    return;
  }

  await gestureRecognition.processFrame(video, recognizedGestures, gestureOutput);

  gridRecognition.prepareForArucoDetection(prepareForArucoDetection);

  const markers = arucoRecognition.processFrame(prepareForArucoDetection);

  const cropGrids = (markerIds: number[], croppedGridCanvas: HTMLCanvasElement) => {
    const grid = markers.filter((m) => markerIds.includes(m.id));
    if (grid.length === 4) {
      const gridCorners = getMiddleCorners(grid);
      gridRecognition.cropGridFromCorners(croppedGridCanvas, gridCorners, 400);
    }
  };
  cropGrids([3, 4, 6, 9], croppedLeftGrid);
  cropGrids([0, 5, 7, 8], croppedRightGrid);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
