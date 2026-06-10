import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { apiUrl } from '../../functions/api';
import { isUserAuthenticated } from '../../redux/selectors/auth';
import { StoreController } from '../../store/connect';
import { styles } from './soundmate-app-css';
import '../invite-link/invite-link';
import '../login-status/login-status';
import '../soundmate-player/soundmate-player';
import '../top-items/top-items';
import '../sync-gate/sync-gate';

declare global {
  interface HTMLElementTagNameMap {
    'soundmate-app': SoundmateApp;
  }
}

/**
 * Read an `?invite=<token>` link param once and strip it from the address bar so
 * a reload (or sharing the now-current URL) can't replay it. Returns the token,
 * or null when the page wasn't opened from an invite link.
 */
function takeInviteParam(): string | null {
  const url = new URL(window.location.href);
  const invite = url.searchParams.get('invite');
  if (invite) {
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url.toString());
  }
  return invite;
}

/**
 * <soundmate-app> — the landing page shell.
 */
@customElement('soundmate-app')
export class SoundmateApp extends LitElement {
  static override styles = [styles];

  #auth = new StoreController(this, isUserAuthenticated);

  /**
   * An invite token from an `?invite=<token>` link. Captured once on construction
   * and stripped from the address bar, then threaded onto the login URL so it
   * rides through the OAuth round-trip and the callback joins us to that group.
   */
  readonly #invite = takeInviteParam();

  get #loginUrl(): string {
    return apiUrl(this.#invite ? `/login?invite=${encodeURIComponent(this.#invite)}` : '/login');
  }

  override render() {
    if (this.#invite) {
      return html`
        <h1>soundmate</h1>
        <p class="sub">You've been invited to a soundmate group.</p>
        <a class="btn" href=${this.#loginUrl}>Log in with Spotify to join</a>
      `;
    }

    return html`
      <h1>soundmate</h1>
      <p class="sub">Find your Spotify soundmate.</p>
      ${this.#auth.value
        ? html`<invite-link></invite-link>`
        : html`<a class="btn" href=${this.#loginUrl}>Log in with Spotify</a>`}
      <login-status></login-status>
      <soundmate-player></soundmate-player>
      <sync-gate>
        <top-items></top-items>
      </sync-gate>
    `;
  }
}
