import { Corner, Marker } from 'js-aruco2';

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
