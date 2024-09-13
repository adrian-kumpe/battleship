import { Ship } from '../../elements/Ship';
import { cellSize } from '../../main';
import { Coord } from '../../shared/models';
import { GameSetup } from './GameSetup';

/**
 * methods all modalities need to include so InputLogic can call them
 * @interface
 */
export interface IInputLogicExtension {
  updateActiveStateExt(): void;
  updateVerticalAlignExt(): void;
  confirmActionExt(): void;
  selectShipExt(): void;
  selectCoordExt(): void;
  moveShipExt(): void;
  rotateShipExt(): void;
  deselectExt(): void;
}

/**
 * basic methods to interact in GameSetup
 */
export class InputLogic {
  static callAfter(method: () => void) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        method.apply(this);
        return result;
      };
      return descriptor;
    };
  }

  /** all input modalities w/ extension methods */
  private extensions: IInputLogicExtension[] = [];
  /** slot for the index of the selected ship (or undefined) */
  selectedShipIndex?: number;
  /** the last ship that was selected so you can still rotate after moving */
  lastSelectedShipIndex?: number;
  /** slot for the selected coord (or undefined) */
  selectedCoord?: Coord;
  /** frame to display the selected coord */
  selectedCoordRef?: Phaser.GameObjects.Rectangle;

  /** active state of each ship is recalculated */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.updateActiveStateExt());
    // wird noch nicht verwendet
  })
  private updateActiveState() {
    this.scene.shipArray.forEach((s) => s.setActive('🌑')); // deactivate all ships
    const setActiveOfLastSelectedShipIndex = (active: '🌓' | '🌑') => {
      if (this.lastSelectedShipIndex) {
        this.scene.shipArray[this.lastSelectedShipIndex].setActive(active);
      }
    };
    const ship = this.getSelectedShip();
    if (ship) {
      setActiveOfLastSelectedShipIndex('🌑'); // order! lastSelectedShipIndex may be the same like selectedShipIndex
      ship.setActive('🌕');
    } else {
      setActiveOfLastSelectedShipIndex('🌓'); // the last selected ship is semi-active because it still can be rotated
    }
  }

  /** vertical align of each ship is recalculated */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.updateVerticalAlignExt());
  })
  private updateVerticalAlign() {
    const bringShipIndexToTop = (i?: number) => {
      if (i !== undefined && this.scene.shipArray[i].shipContainerRef /* trivial */) {
        this.scene.children.bringToTop(this.scene.shipArray[i].shipContainerRef as Phaser.GameObjects.Container);
      }
    };
    bringShipIndexToTop(this.lastSelectedShipIndex);
    bringShipIndexToTop(this.selectedShipIndex);
  }

  constructor(protected scene: GameSetup) {}

  /**
   * register a modality as a subscriber; this class can call extension methods of IInputLogicExtension
   * @param {IInputLogicExtension} extension - input logic class of a input modality
   */
  registerExtension(extension: IInputLogicExtension) {
    this.extensions.push(extension);
  }

  /**
   * process the selection of a coordinate (select or move a ship, select a coord)
   * @param coord - the coord in question
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.confirmActionExt());
  })
  confirmAction(coord?: Coord) {
    const i = this.scene.shipArray.getShipIndexAtCoord(coord); // index of a ship on the focused coord
    if (this.moveShip(true, coord) /* a ship is selected, so move it to the focused coord */) {
      return;
    }
    if (i !== undefined /* there is a ship */) {
      if (this.selectShip(i) /* the ship can be selected */) {
        return;
      }
      if (this.moveShip(true) /* a coord is selected, so move the ship */) {
        return;
      }
      // todo muss nicht erst move und danach select aufgerufen werden?
    }
    this.selectCoord(coord); // only select the coord
  }

  /**
   * select a ship
   * @param i - index of the ship to select within shipArray, undefined to deselect
   * @returns true if the selection was successfull and persists
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.updateVerticalAlign();
    this.updateActiveState();
    this.extensions.forEach((e) => e.selectShipExt());
  })
  selectShip(i?: number): true | undefined {
    this.selectedShipIndex = i;
    if (i !== undefined /* a ship is selected */) {
      this.lastSelectedShipIndex = i;
      if (this.selectedCoord === undefined /* the ship can't be moved because no coord is selected */) {
        return true; // ship was selected and the selection persists
      }
    }
  }

  /**
   * select a coord (cell of the grid)
   * @param coord - coord to select, undefined to deselect
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.updateActiveState();
    this.extensions.forEach((e) => e.selectCoordExt());
    // wird noch nicht verwendet
  })
  selectCoord(coord?: Coord) {
    const drawFocusedCell = (coord: { xPx: number; yPx: number }) => {
      if (!this.selectedCoordRef) {
        this.selectedCoordRef = this.scene.add
          .rectangle(coord.xPx, coord.yPx, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(7, 0x0000ff);
      } else {
        this.selectedCoordRef.setX(coord.xPx).setY(coord.yPx);
      }
    };
    this.selectedCoord = coord;
    if (coord !== undefined /* a coord is selected */) {
      if (this.selectedShipIndex === undefined /* no ship is selected so it can't be moved */) {
        const { xPx, yPx } = this.scene.placingGrid.getGridCellToCoord(coord);
        drawFocusedCell({ xPx: xPx, yPx: yPx });
        // no return true; because the focused cell does not need to be hidden
      }
    } else {
      this.selectedCoordRef?.destroy(); // todo warum wird das benötigt?
      this.selectedCoordRef = undefined; // remove the visual selection of the coord
    }
  }

  /**
   * if ship and coord are selected, move the ship
   * @param deselect - whether to deselect ship and coord after moving
   * @returns true if a ship was moved
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.updateActiveState();
    this.extensions.forEach((e) => e.moveShipExt());
    // wird noch nicht verwendet
  })
  moveShip(deselect: boolean, coord?: Coord): true | undefined {
    coord = coord ?? this.selectedCoord;
    const ship = this.getSelectedShip();
    if (ship && coord) {
      ship.setCoord(coord, true);
      this.selectCoord(undefined); // remove selection of coord
      if (deselect) {
        this.selectShip(undefined); // remove selection of ship
      }
      return true;
    }
  }

  /**
   * rotate the selected ship or the ship that was selected before
   * @returns true if a ship was rotated
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.rotateShipExt());
  })
  rotateShip(): true | undefined {
    const i = this.selectedShipIndex ?? this.lastSelectedShipIndex;
    if (i !== undefined) {
      this.scene.shipArray[i].changeOrientation();
      return true;
    }
  }

  /** deselect ship and coord */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.deselectExt());
  })
  deselect() {
    this.selectCoord(undefined);
    this.selectShip(undefined);
  }

  /** get the selected ship (or undefined) */
  getSelectedShip(): Ship | undefined {
    if (this.selectedShipIndex !== undefined) {
      return this.scene.shipArray[this.selectedShipIndex];
    }
  }
}
