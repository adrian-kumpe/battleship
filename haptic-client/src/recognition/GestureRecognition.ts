import { DrawingUtils, FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { GESTURE_HOLD_FRAMES } from '../config';

type GestureFrameResult = {
  name: string;
  indexTipPx?: { x: number; y: number };
  indexTipNorm?: { x: number; y: number };
};

export class GestureRecognition {
  private gestureRecognizer: GestureRecognizer | null = null;
  private lastVideoTime = -1;
  private results: GestureRecognizerResult | undefined = undefined;
  private gestureStreakName: string | undefined = undefined;
  private gestureStreakCount = 0;

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    });
  }

  isReady(): boolean {
    return !!this.gestureRecognizer;
  }

  async processFrame(
    video: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    gestureOutput: HTMLParagraphElement,
  ): Promise<GestureFrameResult | undefined> {
    if (!this.gestureRecognizer) {
      return;
    }

    const canvasCtx = canvasElement.getContext('2d') as CanvasRenderingContext2D;

    const nowInMs = Date.now();
    if (video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      this.results = this.gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    // Draw gestures on canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    if (this.results && this.results.landmarks) {
      for (const landmarks of this.results.landmarks) {
        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
          color: '#03fc3d',
          lineWidth: 5,
        });
        drawingUtils.drawLandmarks(landmarks, {
          color: '#01b02a',
          lineWidth: 2,
        });

        const indexFinger = [5, 6, 7, 8];
        const indexFingerConnections = indexFinger.slice(0, -1).map((v, i) => ({
          start: v,
          end: indexFinger[i + 1],
        }));
        const indexFingerLandmarks = indexFinger.map((v) => landmarks[v]);
        drawingUtils.drawConnectors(landmarks, indexFingerConnections, {
          color: '#2596be',
          lineWidth: 6,
        });
        drawingUtils.drawLandmarks(indexFingerLandmarks, {
          color: '#1e5265',
          lineWidth: 2,
          radius: 5,
        });
      }
    }
    canvasCtx.restore();

    // Display gesture information
    let confirmedGesture: GestureFrameResult | undefined = undefined;

    if (this.results && this.results.gestures.length > 0) {
      gestureOutput.style.display = 'block';
      const gestureName = this.results.gestures[0][0].categoryName;
      const categoryScore = parseFloat('' + this.results.gestures[0][0].score * 100).toFixed(2);
      const handedness = this.results.handedness[0][0].displayName;
      gestureOutput.innerText = `GestureRecognizer: ${gestureName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
      console.log(gestureName, categoryScore);

      // Streak-Tracking: gleiche Geste über mehrere Frames
      if (this.gestureStreakName === gestureName) {
        this.gestureStreakCount += 1;
      } else {
        this.gestureStreakName = gestureName;
        this.gestureStreakCount = 1;
      }

      // Wenn Streak lang genug, bestätige Geste und liefere Zeigefinger-Koordinate bei Pointer-Geste
      if (this.gestureStreakCount > GESTURE_HOLD_FRAMES) {
        const firstHandLandmarks = this.results.landmarks?.[0];
        const indexTip = firstHandLandmarks?.[8];
        if (gestureName.toLowerCase().includes('point') && indexTip) {
          confirmedGesture = {
            name: gestureName,
            indexTipPx: {
              x: indexTip.x * canvasElement.width,
              y: indexTip.y * canvasElement.height,
            },
            indexTipNorm: { x: indexTip.x, y: indexTip.y },
          };
        } else {
          confirmedGesture = { name: gestureName };
        }
      }
    } else {
      gestureOutput.style.display = 'none';
      this.gestureStreakName = undefined;
      this.gestureStreakCount = 0;
    }

    return confirmedGesture;
  }
}
