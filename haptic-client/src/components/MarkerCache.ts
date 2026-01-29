import { Marker } from 'js-aruco2';
import { Coord } from '../shared/models';
import {
  AVAILABLE_ARUCO_MARKERS,
  MARKER_ROLE,
  MAX_FRAMES_WITHOUT_DETECTION,
  POSITION_CHANGE_THRESHOLD,
} from '../config';
import { getMarkerCenter } from '../utils';

interface CachedMarker {
  marker: Marker;
  lastSeen: number;
  centerPosition: Coord;
}

/**
 * Markers are cached, when position remains the same for all (detected) Markers w/ the same role
 * configure {@link MAX_FRAMES_WITHOUT_DETECTION} and {@link POSITION_CHANGE_THRESHOLD}
 */
export class MarkerCache {
  private markerCache: Map<number, CachedMarker> = new Map(); // marker.id -> CachedMarker

  /** update cache w/ Markers of a new frame */
  updateCachedMarkers(detectedMarkers: Marker[], frameCounter: number) {
    // check for position change
    this.checkForPositionChangeToDeleteMarkerRoleGroup(detectedMarkers);

    // update cache
    detectedMarkers.forEach((m: Marker) => {
      this.markerCache.set(m.id, {
        marker: m,
        lastSeen: frameCounter,
        centerPosition: getMarkerCenter(m),
      });
    });

    // delete old markers
    this.deleteOldMarkers(frameCounter);
  }

  /** get all Markers in the cache */
  getCachedMarkers(): Marker[] {
    return Array.from(this.markerCache.values()).map((cached) => cached.marker);
  }

  /** check if Marker's position changed compared to the cache; calls {@link deleteMarkerRoleGroup} */
  private checkForPositionChangeToDeleteMarkerRoleGroup(detectedMarkers: Marker[]) {
    detectedMarkers.forEach((m) => {
      const cached = this.markerCache.get(m.id);
      if (!cached) {
        return;
      }
      const currentCenter = getMarkerCenter(m);
      const distanceSq =
        Math.pow(currentCenter.x - cached.centerPosition.x, 2) + Math.pow(currentCenter.y - cached.centerPosition.y, 2); // because performance
      if (distanceSq > POSITION_CHANGE_THRESHOLD ** 2) {
        const role = AVAILABLE_ARUCO_MARKERS.find((m2) => m2.id === m.id)?.role;
        if (role) {
          this.deleteMarkerRoleGroup(role);
        }
      }
    });
  }

  /** delete Markers w/ specific role; e.g. 'CORNER_LEFT_GRID' */
  private deleteMarkerRoleGroup(role: MARKER_ROLE) {
    const idsToDelete = AVAILABLE_ARUCO_MARKERS.filter((m) => m.role === role).map(({ id }) => id);
    this.markerCache.forEach((_, id) => {
      if (idsToDelete.includes(id)) {
        this.markerCache.delete(id);
      }
    });
  }

  /** delete Markers w/ too many frames w/o detection */
  private deleteOldMarkers(frameCounter: number): void {
    this.markerCache.forEach((cached, id) => {
      if (frameCounter - cached.lastSeen > MAX_FRAMES_WITHOUT_DETECTION) {
        this.markerCache.delete(id);
      }
    });
  }
}
