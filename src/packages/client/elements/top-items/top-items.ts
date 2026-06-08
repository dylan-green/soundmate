import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../top-tracks/top-tracks';
import '../top-artists/top-artists';
import '../top-playlists/top-playlists';
import '../followed-artists/followed-artists';
import '../saved-albums/saved-albums';
import '../saved-tracks/saved-tracks';
import { styles } from './top-items-css';

declare global {
  interface HTMLElementTagNameMap {
    'top-items': TopItems;
  }
}

// Tab keys: the three live "top" tabs plus the three library tabs fed from the
// Redis-cached library slice (populated by <sync-gate>).
type TabType =
  | 'tracks'
  | 'artists'
  | 'playlists'
  | 'followed-artists'
  | 'saved-albums'
  | 'saved-tracks';

const TABS: { key: TabType; label: string }[] = [
  { key: 'tracks', label: 'Top tracks' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'artists', label: 'Top artists' },
  { key: 'followed-artists', label: 'Following' },
  { key: 'saved-albums', label: 'Saved albums' },
  { key: 'saved-tracks', label: 'Liked songs' },
];

/**
 * <top-items> — tab container. Switches between the live "top" tabs
 * (<top-tracks>/<top-artists>/<top-playlists>) and the library tabs
 * (<followed-artists>/<saved-albums>/<saved-tracks>). Children are mounted
 * lazily (the first time their tab is visited) and then kept alive — hidden, not
 * destroyed — so switching tabs never re-fetches.
 */
@customElement('top-items')
export class TopItems extends LitElement {
  static override styles = [styles];

  @state() private type: TabType = 'tracks';
  // Tabs that have been opened at least once — only these are rendered.
  @state() private visited: Set<TabType> = new Set(['tracks']);

  private select(type: TabType): void {
    if (type === this.type) return;

    this.type = type;

    if (!this.visited.has(type)) {
      this.visited = new Set(this.visited).add(type);
    }
  }

  override render() {
    return html`
      <div class="tabs">
        ${TABS.map(
      (tab) => html`
            <button
              aria-pressed=${this.type === tab.key}
              @click=${() => this.select(tab.key)}
            >
              ${tab.label}
            </button>
          `,
    )}
      </div>

      ${this.visited.has('tracks')
        ? html`<top-tracks ?hidden=${this.type !== 'tracks'}></top-tracks>`
        : nothing}

      ${this.visited.has('artists')
        ? html`<top-artists ?hidden=${this.type !== 'artists'}></top-artists>`
        : nothing}

      ${this.visited.has('playlists')
        ? html`<top-playlists
            ?hidden=${this.type !== 'playlists'}
          ></top-playlists>`
        : nothing}

      ${this.visited.has('followed-artists')
        ? html`<followed-artists
            ?hidden=${this.type !== 'followed-artists'}
          ></followed-artists>`
        : nothing}

      ${this.visited.has('saved-albums')
        ? html`<saved-albums
            ?hidden=${this.type !== 'saved-albums'}
          ></saved-albums>`
        : nothing}

      ${this.visited.has('saved-tracks')
        ? html`<saved-tracks
            ?hidden=${this.type !== 'saved-tracks'}
          ></saved-tracks>`
        : nothing}
    `;
  }
}
