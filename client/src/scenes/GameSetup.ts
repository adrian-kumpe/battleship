import { Scene } from 'phaser';
import { cellSize, defaultFont, gameRadio, gridSize, socket } from '../main';
import { Coord, PlayerNo, RoomConfig, ShipConfig, shipDefinitions } from '../shared/models';
import { Grid } from '../elements/Grid';
import { Ship, ShipArray } from '../elements/Ship';
import { GestureCanvas, GestureRecognition, Gestures } from '../elements/Gestures';

export class GameSetup extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  private roomConfig: RoomConfig;
  private ownPlayerNo: PlayerNo;
  offsetX = 200;
  additionalOffsetX = 420;
  offsetY = 250;

  placingGrid: Grid;
  gestureCanvas: GestureCanvas;
  private gestureRecognition: GestureRecognition;

  private baseShipId = 1;
  shipArray: ShipArray = new ShipArray();
  inputLogic: InputLogic;
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

    this.inputLogic = new InputLogic(this);
    this.keyboardInputLogic = new KeyboardInputLogic(this);
    this.inputLogic.registerExtension(this.keyboardInputLogic);
    this.pointerInputLogic = new PointerInputLogic(this);
    this.inputLogic.registerExtension(this.pointerInputLogic);
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

/**
 * basic methods to interact in GameSetup
 */
class InputLogic {
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
    this.scene.shipArray.forEach((s) => s.setActive('inactive')); // deactivate all ships
    const setActiveOfLastSelectedShipIndex = (active: 'semi-active' | 'inactive') => {
      if (this.lastSelectedShipIndex) {
        this.scene.shipArray[this.lastSelectedShipIndex].setActive(active);
      }
    };
    const ship = this.getSelectedShip();
    if (ship) {
      setActiveOfLastSelectedShipIndex('inactive'); // order! lastSelectedShipIndex may be the same like selectedShipIndex
      ship.setActive('active');
    } else {
      setActiveOfLastSelectedShipIndex('semi-active'); // the last selected ship is semi-active because it still can be rotated
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
   * register a modality as a subscriber which can call public methods of this class; this class can call extension methods of IInputLogicExtension
   * @param {IInputLogicExtension} extension - input logic class of a input modality
   */
  registerExtension(extension: IInputLogicExtension) {
    extension.registerInputLogic(this);
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
    // wird noch nicht verwendet
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

/**
 * methods all modalities need to include so InputLogic can call them
 * @interface
 */
interface IInputLogicExtension {
  updateActiveStateExt(): void;
  updateVerticalAlignExt(): void;
  registerInputLogic(inputLogic: InputLogic): void;
  confirmActionExt(): void;
  selectShipExt(): void;
  selectCoordExt(): void;
  moveShipExt(): void;
  rotateShipExt(): void;
  deselectExt(): void;
}

abstract class InputLogicExtension implements IInputLogicExtension {
  protected inputLogic?: InputLogic;
  updateActiveStateExt() {}
  updateVerticalAlignExt() {}
  constructor(protected scene: GameSetup) {}
  /** subscribe to inputLogic; add input events */
  registerInputLogic(inputLogic: InputLogic) {
    this.inputLogic = inputLogic;
  }
  confirmActionExt() {}
  selectShipExt() {}
  selectCoordExt() {}
  moveShipExt() {}
  rotateShipExt() {}
  deselectExt() {}
}

/**
 * methods to interact w/ keyboard in GameSetup
 * @implements IInputLogicExtension
 */
class KeyboardInputLogic extends InputLogicExtension {
  /** frame to display the focused coord */
  private focusedCellRef?: Phaser.GameObjects.Rectangle;
  /** whether the keyboard started exclusively interacting w/ a ship */
  private exclusiveInput = false;

  /** visibility of the focused cell is recalculated */
  private updateFocusCellVisibility() {
    const visible = this.inputLogic?.selectedShipIndex === undefined;
    this.focusedCellRef?.setAlpha(visible ? 1 : 0);
  }

  /** focused cell is relocated to the selected ships main coord */
  private centerFocusedCell() {
    const i = this.inputLogic?.selectedShipIndex;
    if (i !== undefined) {
      this.focusCell(this.scene.shipArray[i].getCoord());
    }
  }

  /** helper method to navigate w/ arrow keys */
  private arrowKeyAction(shiftX: -1 | 0 | 1, shiftY: -1 | 0 | 1) {
    this.focusCell(shiftX, shiftY);
    if (this.exclusiveInput) {
      this.inputLogic?.moveShip(false, this.getFocusCellCoord());
    }
  }

  /** get the grid coord of the focused cell */
  private getFocusCellCoord(): Coord | undefined {
    if (this.focusedCellRef) {
      return this.scene.placingGrid.getCoordToGridCell(this.focusedCellRef.x, this.focusedCellRef.y);
    }
    return undefined;
  }

  /** change the focused cell by a shift, a new coord or to undefined */
  private focusCell(cell?: Coord): void;
  private focusCell(shiftX: number, shiftY: number): void;
  private focusCell(p1?: Coord | number, p2?: number) {
    const drawFocusedCell = (coord: { xPx: number; yPx: number }) => {
      if (!this.focusedCellRef) {
        this.focusedCellRef = this.scene.add
          .rectangle(coord.xPx, coord.yPx, cellSize, cellSize)
          .setOrigin(0)
          .setStrokeStyle(7, 0xff4500);
      } else {
        this.focusedCellRef.setX(coord.xPx).setY(coord.yPx);
      }
    };
    if (typeof p1 === 'undefined') {
      this.focusedCellRef = p1;
      return;
    }
    if (typeof p1 === 'object') {
      drawFocusedCell(this.scene.placingGrid.getGridCellToCoord(p1));
      return;
    }
    if (typeof p1 === 'number') {
      const { initialX, initialY } = {
        initialX: this.scene.offsetX + cellSize,
        initialY: this.scene.offsetY - cellSize,
      };
      drawFocusedCell({
        xPx: (this.focusedCellRef?.x ?? initialX) + cellSize * p1,
        yPx: (this.focusedCellRef?.y ?? initialY) + cellSize * (p2 ?? 0),
      });
      return;
    }
  }

  /** @override */
  updateVerticalAlignExt() {
    if (this.focusedCellRef) {
      this.scene.children.bringToTop(this.focusedCellRef);
    }
  }

  constructor(scene: GameSetup) {
    super(scene);
  }

  /** @override */
  registerInputLogic(inputLogic: InputLogic) {
    super.registerInputLogic(inputLogic);
    // add keyboard inputs
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard
        .on('keydown-UP', () => this.arrowKeyAction(0, -1))
        .on('keydown-DOWN', () => this.arrowKeyAction(0, 1))
        .on('keydown-LEFT', () => this.arrowKeyAction(-1, 0))
        .on('keydown-RIGHT', () => this.arrowKeyAction(1, 0))
        .on('keydown-ESC', this.deselectExt.bind(this))
        .on('keydown-ENTER', () => inputLogic.confirmAction(this.getFocusCellCoord()))
        .on('keydown-SPACE', () => inputLogic.confirmAction(this.getFocusCellCoord()))
        .on('keydown-R', () => inputLogic.rotateShip());
    }
  }

  /** @override */
  confirmActionExt() {
    this.updateFocusCellVisibility();
    this.centerFocusedCell();
    this.exclusiveInput = this.inputLogic?.selectedShipIndex !== undefined;
  }

  /** @override */
  rotateShipExt() {
    this.centerFocusedCell();
  }

  /** @override */
  deselectExt() {
    this.updateFocusCellVisibility();
  }
}

/**
 * methods to interact w/ point-and-click/dragging in GameSetup
 * @implements IInputLogicExtension
 */
class PointerInputLogic extends InputLogicExtension {
  /** when dragging the pointer is not centered on the ship; only after first rotating activate the correction */
  private dragCorrectionActive = false;
  /** distance between pointer and center of ship  */
  private dragCorrection?: { xPx: number; yPx: number };
  /** cache the current drag to emit drag event when rotating */
  private drag?: { xPx: number; yPx: number };
  /** whether dragstart/pointerdown should be handled as clicking */
  private allowClick = true;
  /** whether dragstart/pointerdown should be handled as dragging */
  private allowDrag = false;

  /** get the computed drag correction */
  private getDragCorrection(): { xPx: number; yPx: number } {
    const ship = this.inputLogic?.getSelectedShip();
    if (this.dragCorrectionActive && ship) {
      return {
        xPx: ship.getDefaultOriginShift('↕️') + (this.dragCorrection?.xPx ?? 0),
        yPx: ship.getDefaultOriginShift('↔️') + (this.dragCorrection?.yPx ?? 0),
      };
    }
    return { xPx: 0, yPx: 0 };
  }

  constructor(scene: GameSetup) {
    super(scene);
  }

  /** @override */
  registerInputLogic(inputLogic: InputLogic) {
    super.registerInputLogic(inputLogic);
    // add pointer input
    this.scene.gestureCanvas.getInputCanvasRef()?.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.allowClick) {
        const coord = this.scene.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
        inputLogic.confirmAction(coord);
      }
      this.allowClick = true;
    });
    // add dragging input
    this.scene.shipArray.forEach((s: Ship, i) => {
      const shipContainerRef = s.getShipContainerRef();
      if (shipContainerRef) {
        this.scene.input.setDraggable(shipContainerRef);
        shipContainerRef.on('drag', (_: Phaser.Input.Pointer, dragX: number, dragY: number) => {
          if (this.allowDrag) {
            shipContainerRef.x = dragX - this.getDragCorrection().xPx;
            shipContainerRef.y = dragY - this.getDragCorrection().yPx;
            this.drag = { xPx: dragX, yPx: dragY };
          }
        });
        shipContainerRef.on('dragstart', (pointer: Phaser.Input.Pointer) => {
          // dragstart event is called before pointerdown
          const coord = this.scene.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
          if (
            this.scene.shipArray.getShipIndexAtCoord(coord) === undefined ||
            this.inputLogic?.selectedCoord !== undefined /* click */
          ) {
            this.allowClick = true;
            return; // clicking and dragging both start w/ dragstart/pointerdown; if there is a selected coord or no ship is targeted, handle as click
          }
          this.allowClick = false;
          if (this.inputLogic?.selectedShipIndex === undefined /* drag */) {
            this.allowDrag = true;
            inputLogic.selectShip(i);
            this.dragCorrectionActive = false; // drag correction is not active yet
            this.dragCorrection = {
              xPx: shipContainerRef.x - pointer.x - s.getDefaultOriginShift('↔️'), // set the drag correction according the pointer's and ship's position
              yPx: shipContainerRef.y - pointer.y - s.getDefaultOriginShift('↔️'), // todo warum ist das horizontal
            };
            return;
          }
          this.allowDrag = false;
        });
        shipContainerRef.on('dragend', () => {
          if (this.allowDrag) {
            s.snapToCell();
            inputLogic.selectShip(undefined);
            this.drag = undefined;
          }
        });
      }
    });
  }

  /** @override */
  confirmActionExt() {
    this.allowDrag = false;
  }

  /** @override */
  rotateShipExt() {
    this.dragCorrectionActive = true;
    const ship = this.inputLogic?.getSelectedShip();
    if (ship && this.drag) {
      ship.shipContainerRef?.emit('drag', undefined, this.drag.xPx, this.drag.yPx); // manually emit drag event because drag event is triggered only when changing the pointer's position
    }
  }
}
