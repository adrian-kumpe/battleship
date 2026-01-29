import { getMarkerCenter, getMiddleCorners } from './utils';
import { Marker } from 'js-aruco2';

let consoleWarnMock: jest.SpyInstance;
const sampleMarkerList: Marker[] = [
  {
    id: 0,
    // prettier-ignore
    corners: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }],
  },
  {
    id: 1,
    // prettier-ignore
    corners: [{ x: 100, y: 0 }, { x: 110, y: 0 }, { x: 100, y: 10 }, { x: 110, y: 10 }],
  },
  {
    id: 2,
    // prettier-ignore
    corners: [{ x: 0, y: 200 }, { x: 10, y: 200 }, { x: 0, y: 210 }, { x: 10, y: 210 }],
  },
  {
    id: 3,
    // prettier-ignore
    corners: [{ x: 100, y: 200 }, { x: 110, y: 200 }, { x: 100, y: 210 }, { x: 110, y: 210 }],
  },
];

describe('haptic-client', () => {
  describe('utils.ts', () => {
    beforeEach(() => {
      consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnMock.mockRestore();
    });
    describe('getMiddleCorners', () => {
      test('should warn when there are not exactly four Markers', () => {
        getMiddleCorners(sampleMarkerList.slice(2));
        expect(consoleWarnMock).toHaveBeenCalled();
      });

      test('should warn if not every Marker has exactly four Corners', () => {
        getMiddleCorners(sampleMarkerList.map(({ id, corners }) => ({ id, corners: corners.slice(2) })));
        expect(consoleWarnMock).toHaveBeenCalled();
      });

      test('should work if Marker[] is empty', () => {
        expect(getMiddleCorners([])).toEqual([]);
      });

      test('should work if Corner[]s are empty', () => {
        expect(getMiddleCorners(sampleMarkerList.map(({ id }) => ({ id, corners: [] })))).toEqual([]);
      });

      test('should return the correct value for a test input', () => {
        expect(getMiddleCorners(sampleMarkerList)).toEqual([
          { x: 10, y: 10 },
          { x: 100, y: 10 },
          { x: 10, y: 200 },
          { x: 100, y: 200 },
        ]);
      });
    });

    describe('getMarkerCenter', () => {
      test('should warn when there are not exactly four Corners', () => {
        getMarkerCenter({ id: 0, corners: [{ x: 0, y: 0 }] });
        expect(consoleWarnMock).toHaveBeenCalled();
      });

      test('should return if there is no Corner', () => {
        expect(getMarkerCenter({ id: 0, corners: [] })).toEqual({ x: -1, y: -1 });
      });

      test('should return the correct value', () => {
        expect(getMarkerCenter(sampleMarkerList[0])).toEqual({ x: 5, y: 5 });
      });
    });
  });
});
