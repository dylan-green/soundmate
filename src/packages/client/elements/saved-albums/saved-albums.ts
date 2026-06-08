import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { StoreController } from '../../store/connect';
import type { SavedAlbum } from '@soundmate/common/library';
import { styles } from './saved-albums-css';

declare global {
  interface HTMLElementTagNameMap {
    'saved-albums': SavedAlbums;
  }
}

/**
 * <saved-albums> — albums saved in the user's library. Reads from the `library`
 * slice populated by <sync-gate> from the Redis cache.
 */
@customElement('saved-albums')
export class SavedAlbums extends LitElement {
  static override styles = [styles];

  @property({ type: Boolean, reflect: true }) override hidden = false;

  private library = new StoreController(this, (s) => s.library);

  override render() {
    const items: SavedAlbum[] | null = this.library.value?.savedAlbums ?? null;
    if (!items) return html`<div class="msg">Loading…</div>`;
    if (items.length === 0) return html`<div class="msg">No saved albums.</div>`;

    return html`<ol>
      ${repeat(
      items,
      (item) => item.id,
      (item) => html`
          <li>
            ${item.imageUrl ? html`<img src=${item.imageUrl} alt="" />` : nothing}
            <span>
              <a href=${item.spotifyUrl} target="_blank" rel="noreferrer"
                >${item.name}</a
              >
              <div class="sub">${item.artists} · ${item.totalTracks} tracks</div>
            </span>
          </li>
        `,
    )}
    </ol>`;
  }
}
