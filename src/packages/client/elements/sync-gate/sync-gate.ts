import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getLoginStatus } from '../../functions/get-login-status';
import { getLibrary, getSyncStatus, startSync } from '../../functions/sync';
import { dispatch } from '../../redux/dispatch/dispatch';
import { LIBRARY_CATEGORIES, type SyncStatus } from '@soundmate/common/library';
import '../loading-spinner/loading-spinner';
import { styles } from './sync-gate-css';

declare global {
  interface HTMLElementTagNameMap {
    'sync-gate': SyncGate;
  }
}

type Phase = 'checking' | 'unauthenticated' | 'syncing' | 'ready' | 'error';

const POLL_INTERVAL_MS = 1000;

/**
 * <sync-gate> — gates its slotted content behind the login-time library sync.
 * When the user is authenticated it triggers POST /me/sync, polls the status,
 * and shows a spinner until the data is ready in Redis; then it loads the cached
 * library into the store and reveals its children.
 */
@customElement('sync-gate')
export class SyncGate extends LitElement {
  static override styles = [styles];

  @state() private phase: Phase = 'checking';
  @state() private status: SyncStatus | null = null;

  /** Pending poll timer, cleared on disconnect. */
  #pollTimer: ReturnType<typeof setTimeout> | undefined;
  /** Guards against state updates after the element is removed. */
  #disconnected = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.start();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnected = true;
    if (this.#pollTimer) clearTimeout(this.#pollTimer);
  }

  private async start(): Promise<void> {
    try {
      const login = await getLoginStatus();
      if (login.status !== 'authenticated') {
        this.phase = 'unauthenticated';
        return;
      }
      this.phase = 'syncing';
      await startSync();
      this.poll();
    } catch {
      this.phase = 'error';
    }
  }

  private poll(): void {
    if (this.#disconnected) return;
    getSyncStatus()
      .then((status) => {
        if (this.#disconnected) return;
        this.status = status;
        if (status.state === 'ready') {
          this.finish();
        } else if (status.state === 'error') {
          this.phase = 'error';
        } else {
          this.#pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
        }
      })
      .catch(() => {
        if (!this.#disconnected) this.phase = 'error';
      });
  }

  /** Load the cached library into the store and reveal the slotted content. */
  private async finish(): Promise<void> {
    try {
      const library = await getLibrary();
      dispatch({ type: 'setLibrary', payload: library });
    } catch {
      // Even if the library read fails, reveal content — the existing tabs can
      // still fetch live.
    }
    if (!this.#disconnected) this.phase = 'ready';
  }

  /** "n/6 loaded" from the per-category progress. */
  private progressLabel(): string {
    if (!this.status) return 'Loading your library…';
    const done = LIBRARY_CATEGORIES.filter(
      (c) => this.status?.categories[c] !== 'pending',
    ).length;
    return `Loading your library… ${done}/${LIBRARY_CATEGORIES.length}`;
  }

  override render() {
    switch (this.phase) {
      case 'checking':
      case 'unauthenticated':
        // Nothing to gate until the user logs in.
        return nothing;
      case 'syncing':
        return html`<loading-spinner
          label=${this.progressLabel()}
        ></loading-spinner>`;
      case 'error':
        return html`
          <div class="msg">
            Couldn't load your library. <slot></slot>
          </div>
        `;
      case 'ready':
        return html`<slot></slot>`;
    }
  }
}
