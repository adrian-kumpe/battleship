import { InputLogicBase } from '../../modalities/InputLogicBase';
import { gameRadio, socket } from '../../main';
import { Coord, Modality } from '../../shared/models';
import { Game } from './Game';

/**
 * methods all modalities need to include so InputLogic can call them
 * @interface
 */
export interface IInputLogicExtension {
  attackCoordExt(): void;
}

/**
 * basic methods to interact in Game
 */
export class InputLogic extends InputLogicBase<IInputLogicExtension> {
  private attackErrorHandler = (error?: string) => {
    if (error) {
      console.warn(error);
      gameRadio.sendMessage('Error: ' + error);
    }
  };

  constructor(protected scene: Game) {
    super();
  }

  /**
   * place an attack
   * @param coord
   */
  @InputLogic.callAfter(function (this: InputLogic) {
    this.extensions.forEach((e) => e.attackCoordExt());
  })
  attackCoord(coord?: Coord) {
    if (coord) {
      socket.emit('attack', { coord: coord, modality: Modality.GESTURE }, this.attackErrorHandler);
      // todo modality entfernen
    }
  }
}
