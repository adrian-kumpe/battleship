import { Marker } from 'js-aruco2';

const AR = require('js-aruco2');

export class ArucoRecognition {
  private detector: any;

  constructor() {
    this.detector = new AR.AR.Detector({
      dictionaryName: 'ARUCO_MIP_36h12',
      maxHammingDistance: 5,
    });
  }

  /** detects aruco markers in the given HTML canvas */
  processFrame(preparedCanvas: HTMLCanvasElement): Marker[] {
    const preparedCtx = preparedCanvas.getContext('2d');
    if (!preparedCtx) {
      return [];
    }

    const width = preparedCanvas.width;
    const height = preparedCanvas.height;

    // Hole ImageData aus dem bereits vorbereiteten Canvas
    const imageData = preparedCtx.getImageData(0, 0, width, height);

    // Erkenne Marker
    const markers = this.detector.detect(imageData);

    // Zeichne Marker auf das Ziel-Canvas
    this.drawMarkers(preparedCtx, markers);

    return markers ?? [];
  }

  /**
   * Draws detected ArUco markers on the canvas
   * @param ctx - Canvas rendering context
   * @param markers - Array of detected markers
   */
  private drawMarkers(ctx: CanvasRenderingContext2D, markers: any[]): void {
    if (!markers || markers.length === 0) {
      return;
    }

    markers.forEach((marker) => {
      // Draw marker corners
      ctx.strokeStyle = '#00ffff'; // Cyan color for marker outline
      ctx.lineWidth = 3;
      ctx.beginPath();

      // Draw the four corners of the marker
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

      // Draw corner points
      ctx.fillStyle = '#ff00ff'; // Magenta for corners
      marker.corners.forEach((corner: any, index: number) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Highlight the first corner differently to show orientation
        if (index === 0) {
          ctx.fillStyle = '#ffff00'; // Yellow for first corner
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ff00ff'; // Reset to magenta
        }
      });

      // Draw marker ID in the center
      const center = this.getMarkerCenter(marker.corners);
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ID: ${marker.id}`, center.x, center.y);

      // Draw a small coordinate system at the center
      this.drawCoordinateSystem(ctx, center, 30);
    });
  }

  /**
   * Calculates the center point of a marker
   * @param corners - Array of marker corners
   * @returns Center point {x, y}
   */
  private getMarkerCenter(corners: any[]): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    corners.forEach((corner) => {
      sumX += corner.x;
      sumY += corner.y;
    });
    return {
      x: sumX / corners.length,
      y: sumY / corners.length,
    };
  }

  /**
   * Draws a small coordinate system at the marker center
   * @param ctx - Canvas rendering context
   * @param center - Center point
   * @param size - Size of the coordinate system
   */
  private drawCoordinateSystem(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, size: number): void {
    // X-axis (red)
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + size, center.y);
    ctx.stroke();

    // Y-axis (green)
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x, center.y + size);
    ctx.stroke();
  }
}
