import { AVAILABLE_ARUCO_MARKERS, MARKER_ROLE, VIDEO_WIDTH, VIDEO_HEIGHT } from './config';

describe('haptic-client', () => {
  describe('config.ts', () => {
    describe('AVAILABLE_MARKERS', () => {
      test('should have four markers for the left grid', () => {
        expect(AVAILABLE_ARUCO_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_LEFT_GRID).length).toBe(4);
      });

      test('should have four markers for the right grid', () => {
        expect(AVAILABLE_ARUCO_MARKERS.filter((m) => m.role === MARKER_ROLE.CORNER_RIGHT_GRID).length).toBe(4);
      });
    });

    describe('VIDEO_WIDTH', () => {
      test('should be of type number', () => {
        expect(typeof VIDEO_WIDTH).toBe('number');
      });
    });

    describe('VIDEO_HEIGHT', () => {
      test('should be of type number', () => {
        expect(typeof VIDEO_HEIGHT).toBe('number');
      });
    });
  });
});
