import { defaultFont, layoutConfig } from '../main';
import { Coord, ShipDefinition, ShipInstance } from '../shared/models';

export class Ship {
  shipContainerRef?: Phaser.GameObjects.Container;
  /** whether the ship is active 🌕, semi-active 🌓 (still can be rotated) or inactive 🌑 */
  private active: '🌕' | '🌓' | '🌑' = '🌑';

  constructor(
    private shipMetaInformation: ShipDefinition & ShipInstance,
    private getCoordToGridCell: (xPx: number, yPx: number) => { x: number; y: number },
    private getGridCellToCoord: {
      (xy: Coord): { xPx: number; yPx: number };
      (x: number, y: number): { xPx: number; yPx: number };
    },
    private coord: Coord,
  ) {}

  /** get shipMetaInformation (including orientation) */
  getShipMetaInformation() {
    return this.shipMetaInformation;
  }

  getShipContainerRef(): Phaser.GameObjects.Container | undefined {
    return this.shipContainerRef;
  }

  /**
   * according to the ships orientation, get the distance from the origin === 0.5 (center) to origin === 0 (upper left corner)
   * to get the distance between center of ship and center of ship's main coord, use Math.abs(this.getDefaultOriginShift('↔️') - this.getDefaultOriginShift('↕️'))
   * @param axis - the axis for which the distance should be determined
   * @returns distance in px
   */
  getDefaultOriginShift(axis: '↔️' | '↕️') {
    return axis === this.shipMetaInformation.orientation
      ? (this.shipMetaInformation.size * layoutConfig.cellSize) / 2
      : layoutConfig.cellSize / 2;
  }

  changeOrientation(orientation?: '↔️' | '↕️') {
    this.shipMetaInformation.orientation = orientation ?? (this.shipMetaInformation.orientation === '↔️' ? '↕️' : '↔️');
    if (this.shipContainerRef) {
      this.shipContainerRef.setRotation(Phaser.Math.DegToRad(this.shipMetaInformation.orientation === '↔️' ? 0 : 90));
      (this.shipContainerRef.getByName('id') as Phaser.GameObjects.Text).setRotation(
        Phaser.Math.DegToRad(this.shipMetaInformation.orientation === '↔️' ? 0 : -90),
      );
    }
    if (this.shipContainerRef) {
      // depending on the orientation the origin shift needs to be added or substracted
      this.shipContainerRef.x += -this.getDefaultOriginShift('↕️') + this.getDefaultOriginShift('↔️');
      this.shipContainerRef.y += -this.getDefaultOriginShift('↔️') + this.getDefaultOriginShift('↕️');
    }
  }

  getCoord(): Coord {
    return this.coord;
  }

  setCoord(coord: Coord, moveShip = true) {
    this.coord = coord;
    if (this.shipContainerRef && moveShip) {
      const { xPx, yPx } = this.getGridCellToCoord(coord);
      this.shipContainerRef.x = xPx + this.getDefaultOriginShift('↔️');
      this.shipContainerRef.y = yPx + this.getDefaultOriginShift('↕️');
    }
  }

  setActive(active: '🌕' | '🌓' | '🌑') {
    this.active = active;
    if (this.shipContainerRef) {
      const rectangle = this.shipContainerRef.getByName('rectangle') as Phaser.GameObjects.Rectangle;
      rectangle.setStrokeStyle(active === '🌑' ? 0 : /* 🌕 */ 7, active === '🌕' ? 0xff4500 : /* 🌓 */ 0xffa985);
      this.shipContainerRef.sendToBack(rectangle); //todo warum kann ich nicht die einfügereihenfolge ändern
    }
  }

  getActive(): '🌕' | '🌓' | '🌑' {
    return this.active;
  }

  snapToCell() {
    // depending on the orientation the shift must be substracted or not
    const getShift = (orientation: '↔️' | '↕️') => {
      return orientation === this.shipMetaInformation.orientation
        ? Math.abs(this.getDefaultOriginShift('↔️') - this.getDefaultOriginShift('↕️'))
        : 0;
    };
    if (this.shipContainerRef) {
      const { x, y } = this.getCoordToGridCell(
        this.shipContainerRef.x - getShift('↔️'),
        this.shipContainerRef.y - getShift('↕️'),
      );
      this.setCoord({ x, y });
    }
  }

  /**
   * draw the ship into a given scene
   * @param scene
   * @param readonly flag
   */
  drawShip(scene: Phaser.Scene, readonly = false) {
    const ship = scene.add.image(0, 0, `ship${this.shipMetaInformation.size}`);
    ship.name = 'ship';
    const rectangle = scene.add.rectangle(0, 0, 70 * this.shipMetaInformation.size, 70);
    rectangle.name = 'rectangle';
    const id = scene.add
      .text(
        -Math.abs(this.getDefaultOriginShift('↔️') - this.getDefaultOriginShift('↕️')) - 3,
        0,
        `#${this.shipMetaInformation.shipId}`,
        defaultFont,
      )
      .setOrigin(0.5, 0.5); // todo schaut das auch gut aus wenn es rotiert ist?
    id.name = 'id';
    const container = scene.add
      .container(-100, -100, [ship, rectangle, id])
      .setSize(ship.width, ship.height)
      .setInteractive();
    if (readonly) {
      // todo das mit readonly muss in gamesetup anders gelöst werden
      container.setAlpha(0.5);
      (container.getByName('id') as Phaser.GameObjects.Text).setAlpha(0);
    }
    this.shipContainerRef = container;
    // refresh attributes
    this.changeOrientation(this.shipMetaInformation.orientation);
    this.setActive(this.active);
    this.setCoord(this.coord);
  }
}

export class ShipArray extends Array {
  public getShipIndexAtCoord(coord?: Coord): number | undefined {
    if (coord === undefined) {
      return undefined;
    }
    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < this[i].getShipMetaInformation().size; j++) {
        const { x, y } = this[i].getCoord();
        const getSize = (orientation: '↔️' | '↕️') => {
          return orientation === this[i].getShipMetaInformation().orientation ? j : 0;
        };
        if (coord.x === x + getSize('↔️') && coord.y === y + getSize('↕️')) {
          return i;
        }
      }
    }
    return undefined;
  }
}
