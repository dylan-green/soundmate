import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, state, property } from 'lit/decorators.js';
import { NotAuthorizedError } from '../../functions/get-top-items';
import { getPlaylistTracks } from '../../functions/get-playlist-tracks';
import { playTrackAt, togglePlayback } from '../soundmate-player/functions';
import { playIcon, pauseIcon } from '../../icons';
import { dispatch } from '../../redux/dispatch/dispatch';
import { StoreController } from '../../store/connect';
import type { TopPlaylist, TopTrack } from '@soundmate/common/top-items';
import { styles } from './top-playlists-css';

declare global {
  interface HTMLElementTagNameMap {
    'top-playlists': TopPlaylists;
  }
}

/**
 * <top-playlists> — the user's playlists. Each row expands to reveal its tracks
 * (lazily fetched, cached by id); playing one queues the whole playlist.
 */
@customElement('top-playlists')
export class TopPlaylists extends LitElement {
  static override styles = styles;

  // Set by the parent tab container via `?hidden`; reactive so we only publish
  // our tracks as the player's queue while this tab is the visible one.
  @property({ type: Boolean, reflect: true }) override hidden = false;

  // The playlist list comes from the library slice (synced from Redis by
  // <sync-gate>). The per-playlist *contents* below are still fetched live on
  // expansion — they aren't part of the synced library.
  private library = new StoreController(this, (s) => s.library);

  // Playlist expansion: which playlist is open, its fetched tracks (cached by
  // id), and the load state for the in-flight expansion.
  @state() private expandedId: string | null = null;
  @state() private expandLoading = false;
  @state() private expandError: 'unauthorized' | 'failed' | null = null;
  @state() private playlistTracks: Record<string, TopTrack[]> = {};

  /** Live play/pause state from the SDK, so expanded rows show the right icon. */
  private playback = new StoreController(this, (s) => s.player);

  override render() {
    const items: TopPlaylist[] | null = this.library.value?.playlists ?? null;
    if (!items) return html`<div class="msg">Loading…</div>`;
    if (items.length === 0) return html`<div class="msg">No playlists.</div>`;

    return html`<ol>
      ${repeat(
      items,
      (item) => item.id,
      (item, index) => {
        const expanded = this.expandedId === item.id;
        return html`
            <li class="playlist-row">
              <button
                class="expand"
                aria-expanded=${expanded}
                aria-label=${expanded
            ? `Collapse ${item.name}`
            : `Expand ${item.name}`}
                @click=${() => { this.togglePlaylist(item.id); }}
              >
                ${expanded ? '▾' : '▸'}
              </button>
              <span class="rank">${index + 1}</span>
              ${item.imageUrl
            ? html`<img src=${item.imageUrl} alt="" />`
            : nothing}
              <span>
                <a href=${item.spotifyUrl} target="_blank" rel="noreferrer"
                  >${item.name}</a
                >
                <div class="sub">
                  ${item.owner} · ${item.trackCount}
                  ${item.trackCount === 1 ? 'track' : 'tracks'}
                </div>
              </span>
            </li>
            ${expanded
            ? html`<li class="playlist-tracks">
                  ${this.renderExpanded(item.id)}
                </li>`
            : nothing}
          `;
      },
    )}
    </ol>`;
  }

  private renderExpanded(id: string) {
    if (this.expandLoading && this.expandedId === id) {
      return html`<div class="msg">Loading…</div>`;
    }
    if (this.expandError && this.expandedId === id) {
      return html`<div class="msg">
        ${this.expandError === 'unauthorized'
          ? 'Log in again to view this playlist.'
          : 'Could not load this playlist.'}
      </div>`;
    }

    const tracks = this.playlistTracks[id];
    if (!tracks || tracks.length === 0) {
      return html`<div class="msg">No tracks in this playlist.</div>`;
    }

    // DO NOT REMOVE THIS. This keeps the current track state up to date in redux,
    // and prevents skipping tracks on a non-selected playlist, track list.
    // Only the visible tab publishes, so a hidden (non-selected) playlists tab
    // can't hijack the queue out from under the list the user is looking at.
    if (!this.hidden) {
      dispatch({ type: 'setTracks', payload: tracks });
    }

    const { currentUri, paused } = this.playback.value;

    return html`<ol class="nested">
      ${repeat(
      tracks,
      (track, i) => `${track.id}-${i}`,
      (track, i) => {
        const isCurrent = track.uri === currentUri;
        const isPlaying = isCurrent && !paused;
        return html`
          <li>
            <span class="rank">${i + 1}</span>
            ${track.imageUrl
            ? html`<img src=${track.imageUrl} alt="" />`
            : nothing}
            <span>
              <a href=${track.spotifyUrl} target="_blank" rel="noreferrer"
                >${track.name}</a
              >
              <div class="sub">${track.artists} · ${track.album}</div>
            </span>
            <button
              class="play"
              title=${isPlaying ? 'Pause' : 'Play on soundmate'}
              aria-label=${isPlaying ? `Pause ${track.name}` : `Play ${track.name}`}
              @click=${() => this.onPlayToggle(id, i, isCurrent)}
            >
              ${isPlaying ? pauseIcon : playIcon}
            </button>
          </li>
        `;
      },
    )}
    </ol>`;
  }

  /** Toggle a playlist open/closed, fetching its tracks once (then cached). */
  private async togglePlaylist(id: string): Promise<void> {
    if (this.expandedId === id) {
      this.expandedId = null;
      return;
    }

    this.expandedId = id;
    this.expandError = null;
    if (this.playlistTracks[id]) {
      this.publishPlaylist(id); // already fetched
      return;
    }

    this.expandLoading = true;
    try {
      const result = await getPlaylistTracks(id);
      this.playlistTracks = { ...this.playlistTracks, [id]: result.items };
      this.publishPlaylist(id);
    } catch (err) {
      this.expandError =
        err instanceof NotAuthorizedError ? 'unauthorized' : 'failed';
    } finally {
      this.expandLoading = false;
    }
  }

  /**
   * Publish an expanded playlist's tracks as the player's queue, so the current
   * selection reflects the open playlist and prev/next navigate within it.
   */
  private publishPlaylist(id: string): void {
    const tracks = this.playlistTracks[id];
    if (tracks && tracks.length > 0) {
      dispatch({ type: 'setTracks', payload: tracks });
    }
  }

  /**
   * Play a track from an expanded playlist (its tracks are already the queue),
   * or toggle play/pause if that track is the one already playing. The SDK
   * reports the resulting state back to the store, flipping the icons.
   */
  private onPlayToggle(id: string, index: number, isCurrent: boolean): void {
    if (!this.playlistTracks[id]) return;

    if (isCurrent) {
      togglePlayback().catch(() => { });
    } else {
      playTrackAt(index).catch(() => { });
    }
  }
}
