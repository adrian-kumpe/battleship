import { Scene } from 'phaser';
import { cellSize, defaultFont, gameRadio, gridSize, socket } from '../main';
import { Coord, PlayerNo, RoomConfig, ShipConfig, shipDefinitions } from '../shared/models';
import { Grid } from '../elements/Grid';
import { Ship, ShipArray } from '../elements/Ship';
import { GestureCanvas, GestureRecognition, Gestures } from '../elements/Gestures';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  offsetX = 200;
  additionalOffsetX = 420;
  offsetY = 250;

  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;

  placingGrid: Grid;
  gestureCanvas: GestureCanvas;
  private gestureRecognition: GestureRecognition;

  private baseShipId = 1;
  shipArray: ShipArray = new ShipArray();
  /** slot for the index of the selected ship (or undefined) */
  selectedShipIndex?: number;
  /** the last ship that was selected so you can still rotate after moving */
  lastSelectedShipIndex?: number;
  /** slot for the selected coord (or undefined) */
  selectedCoord?: Coord;
  /** frame to display the selected coord */
  selectedCoordRef?: Phaser.GameObjects.Rectangle;
  keyboardInputLogic: KeyboardInputLogic;
  pointerInputLogic: PointerInputLogic;

  constructor() {
    super('GameSetup');

    this.placingGrid = new Grid({
      gridOffsetX: this.offsetX + this.additionalOffsetX,
      gridOffsetY: this.offsetY,
      cellSize: cellSize,
    });

    const gestureActions = new Map<Gestures, () => void>([
      [Gestures.CIRCLE, () => console.log('Circle gesture recognized #2')],
    ]);
    this.gestureRecognition = new GestureRecognition([...gestureActions.keys()]);
    this.gestureCanvas = new GestureCanvas(this.gestureRecognition, gestureActions);
  }

  create(args: { roomConfig: RoomConfig; ownPlayerNo: PlayerNo }) {
    this.input.setTopOnly(false); // todo das evtl global machen
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.2, 0.3, 0, 0.1);

    this.roomConfig = args.roomConfig;
    this.ownPlayerNo = args.ownPlayerNo;

    this.placingGrid.drawGrid(this.add, '→');
    this.gestureCanvas.drawGestureCanvas(
      this,
      { x: this.offsetX, y: this.offsetY - cellSize },
      (gridSize + 7) * cellSize,
      (gridSize + 2) * cellSize,
    );
    this.drawShipParking();
    this.drawButton();
    this.drawShips();

    gameRadio.drawRadio(this.add);

    socket.on('gameStart', (args) => {
      gameRadio.sendMessage('All players ready, the game starts now');
      this.scene.start('Game', {
        roomConfig: this.roomConfig,
        playerConfig: args.playerConfig,
        ownPlayerNo: this.ownPlayerNo,
        shipConfig: this.getShipConfig(),
      });
    });

    this.keyboardInputLogic = new KeyboardInputLogic(this);
    this.pointerInputLogic = new PointerInputLogic(this);
  }

  private getShipId(): number {
    return this.baseShipId++;
  }

  private drawShipParking() {
    for (let i = 0; i < 7; i++) {
      for (let j = 1; j < 5; j++) {
        this.add
          .rectangle(this.offsetX + cellSize * j, this.offsetY + cellSize * i, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(4, 0xbbbbbb, 1);
      }
    }
  }

  private drawButton() {
    const buttonConfig = {
      ...defaultFont,
      fontSize: 36,
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: 360,
    };
    this.add
      .text(1485, 900, 'Ready', buttonConfig)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        const shipConfig = this.getShipConfig();
        const error = this.checkShipConfigValid(shipConfig);
        if (error) {
          console.warn(error);
          gameRadio.sendMessage('Error: ' + error);
        } else {
          socket.emit('gameReady', { shipConfig: shipConfig }, (error?: string) => {
            if (error) {
              console.warn(error);
              gameRadio.sendMessage('Error: ' + error);
            }
          });
          // todo hier muss ersichtlich sein, dass die shipconfig abgeschickt wurde
        }
      });
  }

  private drawShips() {
    this.roomConfig.availableShips
      .map((v: number, i: number) => {
        return Array.from(Array(v)).map((_) => i + 1);
      })
      .flat()
      .forEach((size: number, i: number) => {
        const draggableShip = new Ship(
          {
            ...shipDefinitions[size - 1],
            shipId: this.getShipId(),
            orientation: '↔️',
          },
          this.placingGrid.getCoordToGridCell.bind(this.placingGrid),
          this.placingGrid.getGridCellToCoord.bind(this.placingGrid),
          { x: i > 3 ? 0 : 5, y: (0 + 2 * i) % 8 },
        );
        draggableShip.drawShip(this);
        this.shipArray.push(draggableShip);
      });
  }

  private getShipConfig(): ShipConfig {
    return this.shipArray.map((v) => {
      return {
        ...v.getShipMetaInformation(),
        ...v.getCoord(),
      };
    });
  }

  private checkShipConfigValid(shipConfig: ShipConfig): string | undefined {
    const allCoords: (Coord & { guarded: boolean })[] = [];
    shipConfig.forEach((v) => {
      // push all coords where the ship is on or guards into allCoords
      const h = v.orientation === '↔️';
      for (let i = -1; i < 2; i++) {
        allCoords.push({ x: h ? v.x - 1 : v.x + i, y: h ? v.y + i : v.y - 1, guarded: true });
        for (let j = 0; j < v.size; j++) {
          allCoords.push({ x: h ? v.x + j : v.x + i, y: h ? v.y + i : v.y + j, guarded: i !== 0 });
        }
        allCoords.push({ x: h ? v.x + v.size : v.x + i, y: h ? v.y + i : v.y + v.size, guarded: true });
      }
    });
    const allShipsWithinGrid = allCoords.every((c) => {
      return c.guarded || (c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    });
    const shipCoords = allCoords.filter((c) => c.guarded === false);
    const noIllegalOverlaps = shipCoords.every((s) => allCoords.filter((a) => a.x === s.x && a.y === s.y).length <= 1);
    return !allShipsWithinGrid
      ? 'Not all ships are within the grid'
      : !noIllegalOverlaps
        ? 'There are illegal overlaps of some ships'
        : undefined;
  }
}

interface IInputLogic {
  selectShip(i?: number): true | undefined;
  selectCoord(coord?: Coord): void;
  moveShip(deselect: boolean): true | undefined;
  rotateShip(): true | undefined;
}

/**
 * basic methods to interact in GameSetup
 */
class InputLogic implements IInputLogic {
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

  /** active state of each ship is recalculated */
  protected updateActiveState() {
    this.scene.shipArray.forEach((s) => s.setActive('inactive')); // deactivate all ships
    const setActiveOfLastSelectedShipIndex = (active: 'semi-active' | 'inactive') => {
      if (this.scene.lastSelectedShipIndex) {
        this.scene.shipArray[this.scene.lastSelectedShipIndex].setActive(active);
      }
    };
    if (this.scene.selectedShipIndex !== undefined) {
      setActiveOfLastSelectedShipIndex('inactive'); // order! lastSelectedShipIndex may be the same like selectedShipIndex
      this.scene.shipArray[this.scene.selectedShipIndex].setActive('active');
    } else {
      setActiveOfLastSelectedShipIndex('semi-active'); // the last selected ship is semi-active because it still can be rotated
    }
  }

  /** vertical align of each ship is recalculated */
  protected updateVerticalAlign() {
    const bringShipIndexToTop = (i?: number) => {
      if (i !== undefined && this.scene.shipArray[i].shipContainerRef /* trivial */) {
        this.scene.children.bringToTop(this.scene.shipArray[i].shipContainerRef as Phaser.GameObjects.Container);
      }
    };
    bringShipIndexToTop(this.scene.lastSelectedShipIndex);
    bringShipIndexToTop(this.scene.selectedShipIndex);
  }

  constructor(protected scene: GameSetup) {}

  /**
   * process the selection of a coordinate (select or move a ship, select a coord)
   * @param coord - the coord in question
   */
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
  })
  selectShip(i?: number): true | undefined {
    this.scene.selectedShipIndex = i;
    if (i !== undefined /* a ship is selected */) {
      this.scene.lastSelectedShipIndex = i;
      if (this.scene.selectedCoord === undefined /* the ship can't be moved because no coord is selected */) {
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
  })
  selectCoord(coord?: Coord) {
    const drawFocusedCell = (coord: { xPx: number; yPx: number }) => {
      if (!this.scene.selectedCoordRef) {
        this.scene.selectedCoordRef = this.scene.add
          .rectangle(coord.xPx, coord.yPx, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(6, 0x0000ff);
      } else {
        this.scene.selectedCoordRef.setX(coord.xPx).setY(coord.yPx);
      }
    };
    this.scene.selectedCoord = coord;
    if (coord !== undefined /* a coord is selected */) {
      if (this.scene.selectedShipIndex === undefined /* no ship is selected so it can't be moved */) {
        const { xPx, yPx } = this.scene.placingGrid.getGridCellToCoord(coord.x, coord.y);
        drawFocusedCell({ xPx: xPx, yPx: yPx });
        // no return true; because the focused cell does not need to be hidden
      }
    } else {
      this.scene.selectedCoordRef?.destroy(); // todo warum wird das benötigt?
      this.scene.selectedCoordRef = undefined; // remove the visual selection of the coord
    }
  }

  /**
   * if ship and coord are selected, move the ship
   * @param deselect - whether to deselect ship and coord after moving
   * @returns true if a ship was moved
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.updateActiveState();
  })
  moveShip(deselect: boolean, coord?: Coord): true | undefined {
    coord = coord ?? this.scene.selectedCoord;
    if (this.scene.selectedShipIndex !== undefined && coord) {
      this.scene.shipArray[this.scene.selectedShipIndex].setCoord(coord, true);
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
  rotateShip(): true | undefined {
    const i = this.scene.selectedShipIndex ?? this.scene.lastSelectedShipIndex;
    if (i !== undefined) {
      this.scene.shipArray[i].changeOrientation();
      return true;
    }
  }

  /** deselect ship and coord */
  deselect() {
    this.selectCoord(undefined);
    this.selectShip(undefined);
  }
}

/**
 * methods to interact w/ keyboard in GameSetup
 */
class KeyboardInputLogic extends InputLogic {
  /** frame to display the focused coord */
  private focusedCellRef?: Phaser.GameObjects.Rectangle;

  /** visibility of the focused cell is recalculated */
  private updateFocusCellVisibility() {
    const visible = this.scene.selectedShipIndex === undefined;
    this.focusedCellRef?.setAlpha(visible ? 1 : 0);
  }

  /** focused cell is relocated to the selected ships main coord */
  private centerFocusedCell() {
    const i = this.scene.selectedShipIndex;
    if (i !== undefined) {
      this.focusCell(this.scene.shipArray[i].getCoord());
    }
  }

  /** helper method to navigate w/ arrow keys */
  private arrowKeyAction(shiftX: -1 | 0 | 1, shiftY: -1 | 0 | 1) {
    this.focusCell(shiftX, shiftY);
    this.moveShip(false, this.getFocusCellCoord());
  }

  /** @override */
  protected updateVerticalAlign() {
    super.updateVerticalAlign();
    if (this.focusedCellRef) {
      this.scene.children.bringToTop(this.focusedCellRef);
    }
  }

  constructor(scene: GameSetup) {
    super(scene);
    // add keyboard inputs
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard
        .on('keydown-UP', () => this.arrowKeyAction(0, -1))
        .on('keydown-DOWN', () => this.arrowKeyAction(0, 1))
        .on('keydown-LEFT', () => this.arrowKeyAction(-1, 0))
        .on('keydown-RIGHT', () => this.arrowKeyAction(1, 0))
        .on('keydown-ESC', this.deselect.bind(this))
        .on('keydown-ENTER', () => {
          this.confirmAction(this.getFocusCellCoord());
        })
        .on('keydown-SPACE', () => {
          this.confirmAction(this.getFocusCellCoord());
        })
        .on('keydown-R', this.rotateShip.bind(this));
    }
  }

  /** @override */
  @KeyboardInputLogic.callAfter(function (this: KeyboardInputLogic) {
    // todo easier to just call the methods after super.click(coord)
    this.updateFocusCellVisibility();
    this.centerFocusedCell();
  })
  confirmAction(coord?: Coord) {
    super.confirmAction(coord);
  }

  /** @override */
  @KeyboardInputLogic.callAfter(function (this: KeyboardInputLogic) {
    // todo easier to just call the methods after super.rotateShip()
    // return super.rotateShip() && (this.centerFocusedCell(), true);
    this.centerFocusedCell();
  })
  rotateShip(): true | undefined {
    return super.rotateShip();
  }

  /** @override */
  @KeyboardInputLogic.callAfter(function (this: KeyboardInputLogic) {
    // todo easier to just call the method after super.deselect()
    this.updateFocusCellVisibility();
  })
  deselect() {
    super.deselect();
  }

  /** get the grid coord of the focused cell */
  getFocusCellCoord(): Coord | undefined {
    if (this.focusedCellRef) {
      const { x, y } = this.scene.placingGrid.getCoordToGridCell(this.focusedCellRef.x, this.focusedCellRef.y);
      return { x: x, y: y };
    }
    return undefined;
  }

  /** change the focused cell by a shift, a new coord or to undefined */
  focusCell(cell?: Coord): void;
  focusCell(shiftX: number, shiftY: number): void;
  focusCell(p1?: Coord | number, p2?: number) {
    const drawFocusedCell = (coord: { xPx: number; yPx: number }) => {
      if (!this.focusedCellRef) {
        this.focusedCellRef = this.scene.add
          .rectangle(coord.xPx, coord.yPx, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(6, 0xff0000);
      } else {
        this.focusedCellRef.setX(coord.xPx).setY(coord.yPx);
      }
    };
    if (typeof p1 === 'undefined') {
      this.focusedCellRef = p1;
    } else if (typeof p1 === 'object') {
      drawFocusedCell(this.scene.placingGrid.getGridCellToCoord(p1.x, p1.y));
    } else if (typeof p1 === 'number') {
      const { initialX, initialY } = {
        initialX: this.scene.offsetX + cellSize,
        initialY: this.scene.offsetY - cellSize,
      };
      drawFocusedCell({
        xPx: (this.focusedCellRef?.x ?? initialX) + cellSize * p1,
        yPx: (this.focusedCellRef?.y ?? initialY) + cellSize * (p2 ?? 0),
      });
    }
  }
}

/**
 * methods to interact w/ point-and-click/dragging in GameSetup
 */
class PointerInputLogic extends InputLogic {
  /**
   * clicking and dragging both start w/ pointerdown; if there is a selected coord or no ship is targeted, dragging should be prevented
   * @param coord - the coord in question
   * @returns true if dragging, false if the pointerdown event shoud be prevented
   */
  private clickOrDrag(coord: Coord): boolean {
    return this.scene.shipArray.getShipIndexAtCoord(coord) === undefined || this.scene.selectedCoord !== undefined;
  }

  constructor(scene: GameSetup) {
    super(scene);
    // add pointer input
    this.scene.gestureCanvas.getInputCanvasRef()?.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const coord = this.scene.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
      if (this.clickOrDrag(coord) /* click not dragging */) {
        this.confirmAction(coord);
        this.scene.input.setDragState(pointer, 0); // prevent dragging
      }
    });
    // add dragging input
    this.scene.input.on(
      'drag',
      (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      },
    );
    this.scene.shipArray.forEach((s: Ship, i) => {
      const shipContainerRef = s.getShipContainerRef();
      if (shipContainerRef) {
        this.scene.input.setDraggable(shipContainerRef);
        shipContainerRef.on('dragstart', (pointer: Phaser.Input.Pointer) => {
          const coord = this.scene.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
          if (!this.clickOrDrag(coord) /* dragging not click */) {
            this.selectShip(i);
          }
        });
        shipContainerRef.on('dragend', () => {
          s.snapToCell();
          this.selectShip(undefined);
        });
      }
    });
  }
}
