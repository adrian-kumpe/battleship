import { defaultFont, gridSize } from '../main';
import { Coord, ShipDefinition, ShipInstance } from '../shared/models';

export class Ship {
  public shipContainerRef?: Phaser.GameObjects.Container;
  /** whether the ship is active, semi-active (still can be rotated) or inactive */
  private active: 'active' | 'semi-active' | 'inactive' = 'inactive';

  constructor(
    private shipMetaInformation: ShipDefinition & ShipInstance,
    private getCoordToGridCell: (xPx: number, yPx: number) => { x: number; y: number },
    private getGridCellToCoord: (x: number, y: number) => { xPx: number; yPx: number },
    private coord: Coord,
  ) {}

  /** get shipMetaInformation (including orientation) */
  public getShipMetaInformation() {
    return this.shipMetaInformation;
  }

  public changeOrientation(orientation?: '↔️' | '↕️') {
    this.shipMetaInformation.orientation = orientation ?? (this.shipMetaInformation.orientation === '↔️' ? '↕️' : '↔️');
    if (this.shipContainerRef) {
      this.shipContainerRef.setRotation(Phaser.Math.DegToRad(this.shipMetaInformation.orientation === '↔️' ? 0 : 90));
      (this.shipContainerRef.getByName('id') as Phaser.GameObjects.Text).setRotation(
        Phaser.Math.DegToRad(this.shipMetaInformation.orientation === '↔️' ? 0 : -90),
      );
      this.setCoord(this.coord);
    }
  }

  public getCoord(): Coord {
    // todo coord muss auch invalide sein können
    return this.coord;
  }

  public setCoord(coord: Coord, moveShip = true) {
    this.coord = coord;
    if (this.shipContainerRef && moveShip) {
      const { xPx, yPx } = this.getGridCellToCoord(coord.x, coord.y);
      // width and height need to be swapped if the ship is rotated
      const getDefaultShift = (orientation: '↔️' | '↕️') => {
        return orientation === this.shipMetaInformation.orientation
          ? this.shipContainerRef!.width / 2
          : this.shipContainerRef!.height / 2;
      };
      this.shipContainerRef.x = xPx + getDefaultShift('↔️');
      this.shipContainerRef.y = yPx + getDefaultShift('↕️');
    }
  }

  public setActive(active: 'active' | 'semi-active' | 'inactive') {
    // todo bring to top müsste hier passieren
    this.active = active;
    if (this.shipContainerRef) {
      (this.shipContainerRef.getByName('rectangle') as Phaser.GameObjects.Rectangle).setStrokeStyle(
        active !== 'inactive' ? 5 : 0,
        active === 'semi-active' ? 0x234334 : 0xd2042d,
      );
    }
  }

  public getActive(): 'active' | 'semi-active' | 'inactive' {
    return this.active;
  }

  /**
   * draw the ship into a given scene
   * @param scene
   * @param readonly flag
   */
  public drawShip(scene: Phaser.Scene, readonly = false) {
    const shift = this.shipMetaInformation.size * 35 - 35;
    const ship = scene.add.image(0, 0, `ship${this.shipMetaInformation.size}`);
    ship.name = 'ship';
    const rectangle = scene.add.rectangle(0, 0, 70 * this.shipMetaInformation.size, 70);
    rectangle.name = 'rectangle';
    const id = scene.add.text(-shift - 3, 0, `#${this.shipMetaInformation.shipId}`, defaultFont).setOrigin(0.5, 0.5); // todo schaut das auch gut aus wenn es rotiert ist?
    id.name = 'id';
    const container = scene.add
      .container(-100, -100, [ship, rectangle, id])
      .setSize(ship.width, ship.height)
      .setInteractive();
    if (readonly) {
      container.setAlpha(0.5);
      (container.getByName('id') as Phaser.GameObjects.Text).setAlpha(0);
    } else {
      // make the ship draggable
      scene.input.setDraggable(container);
      scene.input.on(
        'drag',
        (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
          gameObject.x = dragX;
          gameObject.y = dragY;
        },
      );
      // add snapping when the users stops dragging + set inactive
      container.on('dragend', () => {
        // depending on the orientation the shift must be substracted or not
        const getShift = (orientation: '↔️' | '↕️') => {
          return orientation === this.shipMetaInformation.orientation ? shift : 0;
        };
        const { x, y } = this.getCoordToGridCell(container.x - getShift('↔️'), container.y - getShift('↕️'));
        const getSize = (orientation: '↔️' | '↕️') => {
          return orientation === this.shipMetaInformation.orientation ? this.shipMetaInformation.size : 0;
        };
        const checkWithinGrid = x >= 0 && x + getSize('↔️') <= gridSize && y >= 0 && y + getSize('↕️') <= gridSize;
        const checkWithinParking = x > -6 && x + getSize('↔️') < 0 && y >= 0 && y + getSize('↕️') < 8;
        this.setCoord({ x, y }, checkWithinGrid || checkWithinParking);
        // this.setActive(false);
      });
      // set active + bring to the top
      container.on('dragstart', () => {
        if (this.shipContainerRef) {
          scene.children.bringToTop(this.shipContainerRef); // todo bring to top wird in der gamesetup gemacht
        }
        // this.setActive(true);
      });
    }
    this.shipContainerRef = container;
    this.refreshAttributes();
  }

  public refreshAttributes() {
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
