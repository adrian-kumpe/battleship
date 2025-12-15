import { DrawingUtils, FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';

export class GestureRecognition {
  private gestureRecognizer: GestureRecognizer | null = null;
  private lastVideoTime = -1;
  private results: GestureRecognizerResult | undefined = undefined;

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
  ): Promise<void> {
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
    if (this.results && this.results.gestures.length > 0) {
      gestureOutput.style.display = 'block';
      const categoryName = this.results.gestures[0][0].categoryName;
      const categoryScore = parseFloat('' + this.results.gestures[0][0].score * 100).toFixed(2);
      const handedness = this.results.handedness[0][0].displayName;
      gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
      console.log(categoryName, categoryScore);

      // Koordinate des Zeigefingers
      if (categoryName.toLowerCase().includes('point')) {
        const firstHandLandmarks = this.results.landmarks?.[0];
        const indexTip = firstHandLandmarks?.[8];
        if (indexTip) {
          const xPx = indexTip.x * canvasElement.width;
          const yPx = indexTip.y * canvasElement.height;
          console.log('Pointer gesture detected at (px):', { x: xPx, y: yPx }, 'normalized:', {
            x: indexTip.x,
            y: indexTip.y,
          });
        }
      }
    } else {
      gestureOutput.style.display = 'none';
    }
  }
}
