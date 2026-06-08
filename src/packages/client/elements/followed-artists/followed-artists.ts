import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { StoreController } from '../../store/connect';
import type { TopArtist } from '@soundmate/common/top-items';
import { styles } from './followed-artists-css';

declare global {
  interface HTMLElementTagNameMap {
    'followed-artists': FollowedArtists;
  }
}

/**
 * <followed-artists> — artists the user follows. Reads from the `library` slice
 * populated by <sync-gate> from the Redis cache (no live fetch of its own).
 */
@customElement('followed-artists')
export class FollowedArtists extends LitElement {
  static override styles = [styles];

  @property({ type: Boolean, reflect: true }) override hidden = false;

  private library = new StoreController(this, (s) => s.library);

  override render() {
    const items: TopArtist[] | null = this.library.value?.followedArtists ?? null;
    if (!items) return html`<div class="msg">Loading…</div>`;
    if (items.length === 0) return html`<div class="msg">No followed artists.</div>`;

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
              <div class="sub">${(item.genres ?? []).slice(0, 3).join(', ')}</div>
            </span>
          </li>
        `,
    )}
    </ol>`;
  }
}
