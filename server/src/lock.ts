import { ErrorCode } from './shared/models';

export class Lock<T> {
  /** object; if present the lock is locked */
  private l?: T;
  constructor(
    /** method to compare lock object */
    private readonly equals: (a: T, b: T) => boolean,
    /** ErrorCode that should be returned by checkLocked */
    private readonly errorCode: ErrorCode,
  ) {}

  /** close the lock by providing a lock object */
  public closeLock(l: T) {
    this.l = l;
  }

  /** release the lock by entering the correct object */
  public releaseLock(l: T): boolean {
    if (this.l && this.equals(this.l, l)) {
      this.l = undefined;
      return true;
    }
    return false;
  }

  /** get whether the lock is locked */
  public checkLocked(): ErrorCode | undefined {
    return this.l ? this.errorCode : undefined;
  }
}
