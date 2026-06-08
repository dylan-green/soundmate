import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { StoreController } from '../../store/connect';
import type { TopArtist } from '@soundmate/common/top-items';
import { styles } from './top-artists-css';

declare global {
  interface HTMLElementTagNameMap {
    'top-artists': TopArtists;
  }
}

/**
 * <top-artists> — the logged-in user's top artists. Reads from the `library`
 * slice populated by <sync-gate> from the Redis cache (no live fetch).
 */
@customElement('top-artists')
export class TopArtists extends LitElement {
  static override styles = [styles];

  @property({ type: Boolean, reflect: true }) override hidden = false;

  private library = new StoreController(this, (s) => s.library);

  override render() {
    const items: TopArtist[] | null = this.library.value?.topArtists ?? null;
    if (!items) return html`<div class="msg">Loading…</div>`;
    if (items.length === 0) return html`<div class="msg">No top artists.</div>`;

    return html`<ol>
      ${repeat(
      items,
      (item) => item.id,
      (item, index) => html`
          <li>
            <span class="rank">${index + 1}</span>
            ${item.imageUrl
          ? html`<img src=${item.imageUrl} alt="" />`
          : nothing}
            <span>
              <a href=${item.spotifyUrl} target="_blank" rel="noreferrer"
                >${item.name}</a
              >
              <div class="sub">
                ${(item.genres ?? []).slice(0, 3).join(', ')}
              </div>
            </span>
          </li>
        `,
    )}
    </ol>`;
  }
}
