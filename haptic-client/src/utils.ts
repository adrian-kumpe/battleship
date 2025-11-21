import { Marker } from 'js-aruco2';

/**
 * calculates the closest corners of markers to the total center of the grid
 * @param grid - array of four Marker
 * @returns array of four Corner
 */
export function getMiddleCorners(grid: Marker[]): { x: number; y: number }[] {
  const gridCenter = {
    x: grid.reduce((sum, m) => sum + m.corners.reduce((s, c) => s + c.x, 0) / m.corners.length, 0) / grid.length,
    y: grid.reduce((sum, m) => sum + m.corners.reduce((s, c) => s + c.y, 0) / m.corners.length, 0) / grid.length,
  };
  return grid.map((m) => {
    const corners = m.corners
      .map((c) => {
        return { x: c.x, y: c.y, distance: (c.x - gridCenter.x) ** 2 + (c.y - gridCenter.y) ** 2 };
      })
      .sort((a, b) => a.distance - b.distance);
    return { x: corners[0].x, y: corners[0].y };
  });
}
