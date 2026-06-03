import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getLoginStatus } from '../../functions/getLoginStatus';
import type { LoginStatus } from '../../types/login-status';
import { styles } from './login-status.css';

/**
 * <login-status> — fetches GET /login/status on connect and renders a badge.
 * No tokens are ever exposed; this only reflects authenticated/unauthenticated.
 */
@customElement('login-status')
export class LoginStatusElement extends LitElement {
  static override styles = [styles];

  @state() private status: LoginStatus | null = null;
  @state() private loading = true;

  override connectedCallback(): void {
    super.connectedCallback();
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    try {
      this.status = await getLoginStatus();
    } catch {
      this.status = null;
    } finally {
      this.loading = false;
    }
  }

  override render() {
    if (this.loading) {
      return html`<div class="box">Checking login status…</div>`;
    }

    if (this.status?.status !== 'authenticated') {
      return html`<div class="box">Sign in to find your soundmate</div>`;
    }

    return html`<div class="box ok">You're signed in!</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'login-status': LoginStatusElement;
  }
}
