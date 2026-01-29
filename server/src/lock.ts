import { ErrorCode } from './shared/models';

export class Lock<T> {
  /** object; if present the lock is locked */
  private l?: T;
  /** method to call when the lock opens */
  private releaseLockCb: any;

  constructor(
    /** method to compare lock object */
    private readonly equals: (a: T, b: T) => boolean,
    /** ErrorCode that should be returned by checkLocked */
    private readonly errorCode: ErrorCode,
  ) {}

  /** close the lock by providing a lock object */
  public closeLock(l: T, cb: any = () => {}) {
    console.warn('closeLock');
    this.l = l;
    this.releaseLockCb = cb;
  }

  /** release the lock by entering the correct object */
  public releaseLock(l: T): boolean {
    if (this.l && this.equals(this.l, l)) {
      console.warn('releaseLock successfull');
      this.l = undefined;
      this.releaseLockCb();
      return true;
    }
    console.warn('releaseLock failed');
    return false;
  }

  /** get whether the lock is locked */
  public checkLocked(): ErrorCode | undefined {
    return this.l ? this.errorCode : undefined;
  }
}
