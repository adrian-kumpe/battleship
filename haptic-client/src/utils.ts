import { Corner, Marker } from 'js-aruco2';
import { Coord, shipDefinitions, ShipPlacement } from './shared/models';

/**
 * Calculates the center of a marker
 * @param marker
 * @returns center Coord
 */
export function getMarkerCenter(marker: Marker): Coord {
  if (marker.corners.length !== 4) {
    console.warn('The Marker should have exactly four Corners!');
  }
  if (marker.corners.length === 0) {
    return { x: -1, y: -1 };
  }
  return marker.corners.reduce(
    (acc, c, i, arr) => ({
      x: acc.x + c.x / arr.length,
      y: acc.y + c.y / arr.length,
    }),
    { x: 0, y: 0 },
  );
}

/**
 * Calculates the closest Corners of Markers to the total center of the grid
 * @param grid - array of four Markers
 * @returns array of four Corners being the Corners of grid
 */
export function getMiddleCorners(grid: Marker[]): Corner[] {
  if (grid.length !== 4) {
    console.warn('The grid should consist of exactly four Markers!');
  }
  if (grid.some((m) => m.corners.length !== 4)) {
    console.warn('Every Marker should have exactly four Corners!');
  }
  const gridCenter = {
    x: grid.reduce((sum, m) => sum + m.corners.reduce((s, c) => s + c.x, 0) / m.corners.length, 0) / grid.length,
    y: grid.reduce((sum, m) => sum + m.corners.reduce((s, c) => s + c.y, 0) / m.corners.length, 0) / grid.length,
  };
  return grid.flatMap((m) => {
    if (m.corners.length === 0) {
      return [];
    }
    const corners = m.corners
      .map((c) => {
        return { x: c.x, y: c.y, distance: (c.x - gridCenter.x) ** 2 + (c.y - gridCenter.y) ** 2 };
      })
      .sort((a, b) => a.distance - b.distance);
    return { x: corners[0].x, y: corners[0].y };
  });
}

let baseShipId = 0;

/** get a fresh id */
const getShipId = () => baseShipId++;

export function getShipPlacement(ship: Coord[]): ShipPlacement {
  if (ship.length !== 2) {
    console.warn('The ship should consist of exactly two Markers!');
    return [];
  }
  const [end1, end2] = ship;
  if (!(end1.x - end2.x === 0 || end1.y - end2.y === 0)) {
    console.warn('Either x or y coordinate of the ship should be the same!');
    return [];
  }
  const orientation = end1.x - end2.x ? '↔️' : '↕️';
  const size = 1 + Math.abs(end1.x + end1.y - end2.x - end2.y);
  const shipDefinition = shipDefinitions.find((s) => s.size === size);
  if (!shipDefinition) {
    console.warn('The size of the ship is unknown.');
    return [];
  }
  const smallerCoordinate = end1.x + end1.y < end2.x + end2.y ? end1 : end2;
  return [
    {
      ...shipDefinition,
      shipId: getShipId(),
      orientation: orientation,
      ...smallerCoordinate,
    },
  ];
}

// export function deleteDuplicateMarkers(markers: Marker[]): Marker[] {
//   // todo hammingDistance
//   return markers.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
// }
