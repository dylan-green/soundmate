import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { isUserAuthenticated } from '../../redux/selectors/auth';
import { StoreController } from '../../store/connect';
import { styles } from './soundmate-app-css';
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
 * <soundmate-app> — the landing page shell.
 */
@customElement('soundmate-app')
export class SoundmateApp extends LitElement {
  static override styles = [styles];

  #auth = new StoreController(this, isUserAuthenticated);

  override render() {
    return html`
      <h1>soundmate</h1>
      <p class="sub">Find your Spotify soundmate.</p>
      ${this.#auth.value
        ? nothing
        : html`<a class="btn" href="/login">Log in with Spotify</a>`}
      <login-status></login-status>
      <soundmate-player></soundmate-player>
      <sync-gate>
        <top-items></top-items>
      </sync-gate>
    `;
  }
}
