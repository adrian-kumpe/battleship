import { Corner, Marker } from 'js-aruco2';
import { getMarkerCenter } from '../utils';
import { VIDEO_WIDTH, VIDEO_HEIGHT } from '../config';
import { MarkerCache } from '../components/MarkerCache';

const AR = require('js-aruco2');

export class ArucoRecognition {
  private detector: any;
  private markerCache = new MarkerCache();

  constructor() {
    this.detector = new AR.AR.Detector({
      dictionaryName: 'ARUCO_MIP_36h12',
      maxHammingDistance: 5,
    });
  }

  /** detects aruco markers in the given HTML canvas */
  processFrame(preparedCanvas: HTMLCanvasElement, frameCounter: number): Marker[] {
    const preparedCtx = preparedCanvas.getContext('2d');
    if (!preparedCtx) {
      return [];
    }

    const imageData = preparedCtx.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    const detectedMarkers = this.detector.detect(imageData) ?? [];

    this.markerCache.updateCachedMarkers(detectedMarkers, frameCounter);

    const allCachedMarkers = this.markerCache.getCachedMarkers();
    this.drawMarkers(preparedCtx, detectedMarkers, allCachedMarkers);
    return allCachedMarkers;
  }

  /** draws detected and cached ArUco markers on the canvas */
  private drawMarkers(ctx: CanvasRenderingContext2D, detectedMarkers: Marker[], allCachedMarkers: Marker[]): void {
    if (!allCachedMarkers || allCachedMarkers.length === 0) {
      return;
    }

    const detectedMarkerIds = new Set<number>(detectedMarkers.map((m) => m.id));

    allCachedMarkers.forEach((marker) => {
      const markerIsCached = !detectedMarkerIds.has(marker.id);

      ctx.strokeStyle = ctx.fillStyle = markerIsCached ? '#ff6600' : '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // four corners of the marker
      for (let i = 0; i < marker.corners.length; i++) {
        const corner = marker.corners[i];
        if (i === 0) {
          ctx.moveTo(corner.x, corner.y);
        } else {
          ctx.lineTo(corner.x, corner.y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // corner points
      marker.corners.forEach((corner: Corner) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // marker ID in the center
      const center = getMarkerCenter(marker);
      ctx.font = 'bold 38px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('' + marker.id, center.x, center.y + 4);
    });
  }
}
