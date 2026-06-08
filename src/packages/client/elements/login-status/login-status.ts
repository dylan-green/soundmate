import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { loadAuthStatus } from '../../functions/auth';
import { StoreController } from '../../store/connect';
import { styles } from './login-status-css';

declare global {
  interface HTMLElementTagNameMap {
    'login-status': LoginStatusElement;
  }
}

/**
 * <login-status> — reflects the shared auth slice as a badge. It kicks off the
 * GET /login/status check on connect, then re-renders reactively as the slice
 * changes (e.g. when <soundmate-player> caches a token or hits a 401). No
 * tokens are ever exposed; this only reflects authenticated/unauthenticated.
 */
@customElement('login-status')
export class LoginStatusElement extends LitElement {
  static override styles = [styles];

  /** Live view of the auth slice (re-renders on change). */
  private auth = new StoreController(this, (s) => s.auth);

  override connectedCallback(): void {
    super.connectedCallback();
    void loadAuthStatus();
  }

  override render() {
    const { status } = this.auth.value;

    if (status === 'unknown') {
      return html`<div class="box">Checking login status…</div>`;
    }

    if (status !== 'authenticated') {
      return html`<div class="box">Sign in to find your soundmate</div>`;
    }

    return nothing;
  }
}
