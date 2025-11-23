declare module 'js-aruco2' {
  export class Detector {
    constructor();
    detect(imageData: ImageData): Marker[];
  }

  export interface Marker {
    id: number;
    corners: Corner[];
  }

  export interface Corner {
    x: number;
    y: number;
  }

  const AR: {
    Detector: typeof Detector;
  };

  export default AR;
}
