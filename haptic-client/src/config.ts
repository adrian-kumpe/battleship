/** Roles an marker can have */
export enum MARKER_ROLE {
  'CORNER_LEFT_GRID',
  'CORNER_RIGHT_GRID',
  'HIT',
  'MISS',
  'SHIP',
}

/** Config information of an marker */
export interface MarkerConfig {
  id: number;
  role: MARKER_ROLE;
}

/**
 * All markers to recognize w/ MarkerConfig
 * @constant
 */
export const AVAILABLE_MARKERS: MarkerConfig[] = [
  { id: 0, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 3, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 4, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 5, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 6, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 7, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 8, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 9, role: MARKER_ROLE.CORNER_LEFT_GRID },
];

/**
 * desired video resolution width
 * @constant
 */
export const VIDEO_WIDTH = 1440;

/**
 * desired video resolution height
 * @constant
 */
export const VIDEO_HEIGHT = 1080;
