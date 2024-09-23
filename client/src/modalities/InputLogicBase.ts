/**
 * @param IInputLogicExtension
 */
export abstract class InputLogicBase<T extends Phaser.Scene, I> {
  protected static callAfter(method: () => void) {
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
  protected extensions: I[] = [];

  constructor(protected scene: T) {}

  /**
   * register a modality as a subscriber; this class can call extension methods of T
   * @param {I} extension - input logic class of a input modality
   */
  registerExtension(extension: I) {
    this.extensions.push(extension);
  }
}
