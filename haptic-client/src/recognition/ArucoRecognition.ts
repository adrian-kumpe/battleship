import { Corner, Marker } from 'js-aruco2';
import { getMarkerCenter } from '../utils';
import {
  AVAILABLE_MARKERS,
  MARKER_ROLE,
  POSITION_CHANGE_THRESHOLD,
  MAX_FRAMES_WITHOUT_DETECTION,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
} from '../config';

const AR = require('js-aruco2');

interface CachedMarker {
  marker: Marker;
  lastSeen: number;
  centerPosition: { x: number; y: number }; // Center position für Bewegungserkennung
}

export class ArucoRecognition {
  private detector: any;
  private markerCache: Map<number, CachedMarker> = new Map(); // marker.id -> CachedMarker

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

    const needReset = this.checkForPositionChange(detectedMarkers);
    if (needReset) {
      this.markerCache.clear();
    }

    // update cache
    // todo hammingdistance when markers are recognized twice
    detectedMarkers.forEach((marker: Marker) => {
      this.markerCache.set(marker.id, {
        marker: marker,
        lastSeen: frameCounter,
        centerPosition: getMarkerCenter(marker),
      });
    });
    this.cleanupOldMarkers(frameCounter);

    const allCachedMarkers = Array.from(this.markerCache.values()).map((cached) => cached.marker);
    this.drawMarkers(preparedCtx, detectedMarkers, allCachedMarkers);
    return allCachedMarkers;
  }

  /** check if grid marker's position changed compared to the cache */
  private checkForPositionChange(detectedMarkers: Marker[]): boolean {
    const gridCornerIds = AVAILABLE_MARKERS.filter(
      (m) => m.role === MARKER_ROLE.CORNER_LEFT_GRID || m.role === MARKER_ROLE.CORNER_RIGHT_GRID,
    ).map((m) => m.id);

    return detectedMarkers.some((marker) => {
      if (!gridCornerIds.includes(marker.id)) {
        return false;
      }

      const cached = this.markerCache.get(marker.id);
      if (!cached) {
        return false;
      }

      const currentCenter = getMarkerCenter(marker);
      const distance = Math.sqrt(
        Math.pow(currentCenter.x - cached.centerPosition.x, 2) + Math.pow(currentCenter.y - cached.centerPosition.y, 2),
      );

      return distance > POSITION_CHANGE_THRESHOLD;
    });
  }

  /** delete markers w/ too many frames w/o detection */
  private cleanupOldMarkers(frameCounter: number): void {
    const toDelete: number[] = [];

    this.markerCache.forEach((cached, markerId) => {
      if (frameCounter - cached.lastSeen > MAX_FRAMES_WITHOUT_DETECTION) {
        toDelete.push(markerId);
      }
    });

    toDelete.forEach((id) => this.markerCache.delete(id));
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
