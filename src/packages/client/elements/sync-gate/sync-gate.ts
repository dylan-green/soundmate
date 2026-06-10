import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getSession } from '../../functions/session';
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
  /** The active member's status — drives the "n/6 loaded" label. */
  @state() private status: SyncStatus | null = null;

  /** The member whose library this gate loads into the store. */
  private activeUserId: string | null = null;

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
      const session = await getSession();
      if (!session.activeUserId) {
        this.phase = 'unauthenticated';
        return;
      }
      this.activeUserId = session.activeUserId;
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
      .then((statusByUser) => {
        if (this.#disconnected) return;
        // This gate only loads the ACTIVE member's library, so its progress —
        // and the decision to reveal or error — tracks that member alone. A
        // non-active member's failure (or success) must not mask the active
        // member's actual state.
        const status = this.activeUserId
          ? (statusByUser[this.activeUserId] ?? null)
          : null;
        this.status = status;

        if (!status || status.state === 'pending') {
          this.#pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
        } else if (status.state === 'ready') {
          this.finish();
        } else {
          this.phase = 'error'; // the active member's sync failed
        }
      })
      .catch(() => {
        if (!this.#disconnected) this.phase = 'error';
      });
  }

  /** Load the active member's cached library into the store and reveal content. */
  private async finish(): Promise<void> {
    try {
      const libraryByUser = await getLibrary();
      const library = this.activeUserId
        ? libraryByUser[this.activeUserId]
        : undefined;
      if (library) {
        dispatch({ type: 'setLibrary', payload: library });
      }
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
        return nothing;
      case 'ready':
        return html`<slot></slot>`;
    }
  }
}
