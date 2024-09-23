/**
 * generic methods to handle voice inputs
 * @abstract
 */
export abstract class VoiceInput<T extends Phaser.Scene> {
  constructor(protected scene: T) {}
}
