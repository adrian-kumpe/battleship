import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { GridRecognition } from './recognition/GridRecognition';
import { ArucoRecognition } from './recognition/ArucoRecognition';
import { Marker } from 'js-aruco2';

/**
 * desired video resolution width
 * @constant
 */
const VIDEO_WIDTH = 640;
/**
 * desired video resolution height
 * @constant
 */
const VIDEO_HEIGHT = 480;

/** gesture recognition w/ MediaPipe */
const gestureRecognition = new GestureRecognition();
/** grid recognition and cropping w/ OpenCV.js */
const gridRecognition = new GridRecognition();
/** ArUco marker recognition w/ js-aruco2 */
const arucoRecognition = new ArucoRecognition();

const prepareForArucoDetection = document.getElementById('prepareForArucoDetection') as HTMLCanvasElement;
const croppedLeftGrid = document.getElementById('croppedLeftGrid') as HTMLCanvasElement;
const croppedRightGrid = document.getElementById('croppedRightGrid') as HTMLCanvasElement;
const outputCanvas2 = document.getElementById('output_canvas2') as HTMLCanvasElement;
const outputCanvas3 = document.getElementById('output_canvas3') as HTMLCanvasElement;

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
const canvasElement = document.getElementById('output_canvas') as HTMLCanvasElement;
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
    canvasElement.width = outputCanvas2.width = outputCanvas3.width = prepareForArucoDetection.width = VIDEO_WIDTH;
    canvasElement.height = outputCanvas2.height = outputCanvas3.height = prepareForArucoDetection.height = VIDEO_HEIGHT;
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

  await gestureRecognition.processFrame(video, canvasElement, gestureOutput);

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

  // gridRecognition.processFrame(outputCanvas2, outputCanvas3);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
