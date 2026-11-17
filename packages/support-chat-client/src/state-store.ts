type Listener = () => void

/** Минимальный стор: состояние неизменяемое, подписка — для useSyncExternalStore и любых фреймворков. */
export class StateStore<T extends object> {
  private state: T
  private readonly listeners = new Set<Listener>()

  constructor(initial: T) {
    this.state = initial
  }

  public getState = (): T => this.state

  public setState(patch: Partial<T> | ((state: T) => Partial<T>)): void {
    const next = typeof patch === 'function' ? patch(this.state) : patch
    this.state = { ...this.state, ...next }
    this.listeners.forEach(listener => listener())
  }

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
