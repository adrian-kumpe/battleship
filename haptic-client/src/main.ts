import { ClientToServerEvents, ReportMode, ServerToClientEvents } from './shared/models';
import { io, Socket } from 'socket.io-client';
import { GestureRecognition } from './recognition/GestureRecognition';
import { GridRecognition } from './recognition/GridRecognition';

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

// UI-Elemente
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
    canvasElement.width = outputCanvas2.width = outputCanvas3.width = VIDEO_WIDTH;
    canvasElement.height = outputCanvas2.height = outputCanvas3.height = VIDEO_HEIGHT;
  });
}

async function predictWebcam() {
  if (gestureRecognition.isReady()) {
    await gestureRecognition.processFrame(video, canvasElement, gestureOutput);
  }
  if (gridRecognition.isReady()) {
    gridRecognition.processFrame(outputCanvas2, outputCanvas3);
  }
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
