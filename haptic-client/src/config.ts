/** Roles a marker can have */
export enum MARKER_ROLE {
  'CORNER_LEFT_GRID',
  'CORNER_RIGHT_GRID',
  'HIT',
  'MISS',
  'SHIP1',
  'SHIP2',
}

/** Config information of an ArUco marker */
export interface ArUcoMarkerConfig {
  id: number;
  role: MARKER_ROLE;
}

/**
 * All ArUco markers to recognize w/ MarkerConfig
 * @constant
 */
export const AVAILABLE_ARUCO_MARKERS: ArUcoMarkerConfig[] = [
  { id: 0, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 1, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 2, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 3, role: MARKER_ROLE.CORNER_LEFT_GRID },
  { id: 4, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 5, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 6, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 7, role: MARKER_ROLE.CORNER_RIGHT_GRID },
  { id: 8, role: MARKER_ROLE.SHIP1 },
  { id: 9, role: MARKER_ROLE.SHIP1 },
  { id: 10, role: MARKER_ROLE.SHIP2 },
  { id: 11, role: MARKER_ROLE.SHIP2 },
];

export interface CellMarkerConfig {
  role: MARKER_ROLE;
  lowerHSV: number[];
  upperHSV: number[];
}

export const AVAILABLE_CELL_MARKERS: CellMarkerConfig[] = [
  {
    role: MARKER_ROLE.HIT, // orange
    lowerHSV: [10, 140, 80],
    upperHSV: [25, 255, 255],
  },
  {
    role: MARKER_ROLE.MISS, // blue
    lowerHSV: [100, 120, 50],
    upperHSV: [130, 255, 255],
  },
  // todo werte testen
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

/**
 * threshold to detect movement of grid markers
 * @constant
 */
export const POSITION_CHANGE_THRESHOLD = 10;

/**
 * delete old markers from cache
 * @constant
 */
export const MAX_FRAMES_WITHOUT_DETECTION = 25;

/**
 * milliseconds a gesture must be detected before it is reported
 * @constant
 */
export const GESTURE_HOLD_DURATION_MS = 3000;

/**
 * the size of the haptic game board
 * @constant
 */
export const BOARD_SIZE = 8;

/**
 * the amount of ships for the haptic game board
 * @constant
 */
export const AVAILABLE_SHIPS = [1, 2, 3, 2];
