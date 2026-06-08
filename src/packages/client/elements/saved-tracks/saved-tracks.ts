import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { playTrackAt, togglePlayback } from '../soundmate-player/functions';
import { playIcon, pauseIcon } from '../../icons';
import { dispatch } from '../../redux/dispatch/dispatch';
import { StoreController } from '../../store/connect';
import type { TopTrack } from '@soundmate/common/top-items';
import { styles } from './saved-tracks-css';

declare global {
  interface HTMLElementTagNameMap {
    'saved-tracks': SavedTracks;
  }
}

/**
 * <saved-tracks> — the user's "Liked Songs". Reads from the `library` slice
 * populated by <sync-gate> from the Redis cache. Each track is playable on the
 * soundmate device, mirroring <top-tracks>.
 */
@customElement('saved-tracks')
export class SavedTracks extends LitElement {
  static override styles = [styles];

  @property({ type: Boolean, reflect: true }) override hidden = false;

  private library = new StoreController(this, (s) => s.library);

  /** Live play/pause state from the SDK, so rows show the right icon. */
  private playback = new StoreController(this, (s) => s.player);

  override render() {
    const items: TopTrack[] | null = this.library.value?.savedTracks ?? null;
    if (!items) return html`<div class="msg">Loading…</div>`;
    if (items.length === 0) return html`<div class="msg">No saved tracks.</div>`;

    // Publish our tracks as the player's queue so prev/next navigate them — but
    // only while this tab is visible, so a hidden tab can't hijack the queue out
    // from under the list the user is looking at.
    if (!this.hidden) {
      dispatch({ type: 'setTracks', payload: items });
    }

    const { currentUri, paused } = this.playback.value;

    return html`<ol>
      ${repeat(
      items,
      (item) => item.id,
      (item, index) => {
        const isCurrent = item.uri === currentUri;
        const isPlaying = isCurrent && !paused;
        return html`
          <li>
            <span class="rank">${index + 1}</span>
            ${item.imageUrl ? html`<img src=${item.imageUrl} alt="" />` : nothing}
            <span>
              <a href=${item.spotifyUrl} target="_blank" rel="noreferrer"
                >${item.name}</a
              >
              <div class="sub">${item.artists} · ${item.album}</div>
            </span>
            <button
              class="play"
              title=${isPlaying ? 'Pause' : 'Play on soundmate'}
              aria-label=${isPlaying ? `Pause ${item.name}` : `Play ${item.name}`}
              @click=${() => this.onPlayToggle(index, isCurrent)}
            >
              ${isPlaying ? pauseIcon : playIcon}
            </button>
          </li>
        `;
      },
    )}
    </ol>`;
  }

  /**
   * Clicking the current track's button pauses/resumes it; clicking any other
   * track's button starts that track. The SDK reports the resulting state back
   * to the store, which flips the icons.
   */
  private onPlayToggle(index: number, isCurrent: boolean): void {
    if (isCurrent) {
      togglePlayback().catch(() => { });
    } else {
      playTrackAt(index).catch(() => { });
    }
  }
}
