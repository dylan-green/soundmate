import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { type RootState, store } from '../redux/store';

/**
 * Reactive controller that subscribes a Lit host to a slice of the Redux store
 * and triggers a re-render whenever the selected value changes (by reference).
 *
 * Usage:
 *   private tracks = new StoreController(this, (s) => s.tracks);
 *   // ...this.tracks.value is the live selected state
 */
export class StoreController<T> implements ReactiveController {
  value: T;
  #unsubscribe: (() => void) | undefined;

  constructor(
    private host: ReactiveControllerHost,
    private selector: (state: RootState) => T,
  ) {
    host.addController(this);
    this.value = selector(store.getState());
  }

  hostConnected(): void {
    this.#unsubscribe = store.subscribe(() => {
      const next = this.selector(store.getState());
      if (next !== this.value) {
        this.value = next;
        this.host.requestUpdate();
      }
    });
  }

  hostDisconnected(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
  }
}
