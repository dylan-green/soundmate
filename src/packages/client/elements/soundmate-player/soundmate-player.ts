import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { NotAuthorizedError } from '../../functions/errors';
import { getCachedAccessToken } from '../../functions/auth';
import {
  playNext,
  playPrev,
  setActivePlayer,
  setPlaybackDevice,
} from './functions';
import { nextIcon, pauseIcon, playIcon, prevIcon } from '../../icons';
import { StoreController } from '../../store/connect';
import { dispatch } from '../../redux/dispatch/dispatch';
import { styles } from './soundmate-player-css';
import type { TopTrack } from '@soundmate/common/top-items';

type PlayerStatus =
  | 'connecting'
  | 'ready'
  | 'unauthorized'
  | 'premium-required'
  | 'error';

// The subset of a normalized track the player needs to render the now-playing UI.
type CurrentTrack = Pick<TopTrack, 'name' | 'artists' | 'imageUrl'>;

declare global {
  interface HTMLElementTagNameMap {
    'soundmate-player': SoundmatePlayer;
  }
}

type VolumeRange = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;

/**
 * <soundmate-player> — a Spotify Web Playback SDK device named "soundmate".
 *
 * Auth comes from the auth slice via getCachedAccessToken() (GET /auth/token,
 * cached in-memory) — no token is hardcoded. Requires the `streaming` scope
 * and a Spotify Premium account.
 * To hear audio, open Spotify and select "soundmate" as the playback device.
 */
@customElement('soundmate-player')
export class SoundmatePlayer extends LitElement {
  static override styles = [styles];

  @state() private status: PlayerStatus = 'connecting';
  @state() private current: CurrentTrack | null = null;
  @state() private volume: VolumeRange = 0.5;
  @state() private paused = true;
  @state() private errorMessage = '';

  private player: Spotify.Player | null = null;

  /** Live view of the user's tracks list from the store (re-renders on change). */
  private tracks = new StoreController(this, (s) => s.tracks);

  // connect to spotify SDK on connect, set Spotify instance on window, initialize player
  override connectedCallback(): void {
    super.connectedCallback();
    // The SDK sets window.Spotify, then calls onSpotifyWebPlaybackSDKReady.
    if (window.Spotify) {
      this.initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = () => this.initPlayer();
    }
  }

  // cleanup player and disconnect
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    setPlaybackDevice(null);
    setActivePlayer(null);
    this.player?.disconnect();
    this.player = null;
  }

  // only initialize player on connect - only happens once
  private initPlayer(): void {
    const player = new Spotify.Player({
      name: 'soundmate',
      volume: this.volume,
      // Called on connect and whenever the token needs refreshing. Reads the
      // cached token from the auth slice, re-fetching only when it's stale.
      getOAuthToken: (cb) => {
        getCachedAccessToken()
          .then((token) => cb(token))
          .catch((err: unknown) => {
            this.status =
              err instanceof NotAuthorizedError ? 'unauthorized' : 'error';
          });
      },
    });

    player.addListener('ready', ({ device_id }) => {
      setPlaybackDevice(device_id);
      this.status = 'ready';
    });

    player.addListener('not_ready', () => {
      setPlaybackDevice(null);
      this.status = 'connecting';
    });

    player.addListener('player_state_changed', (s) => {
      if (!s) {
        this.current = null;
        this.paused = true;
        // Nothing loaded — clear the shared playback state so list rows reset.
        dispatch({ type: 'setPlayback', payload: { currentUri: '', paused: true } });
        return;
      }
      this.paused = s.paused;
      const track = s.track_window.current_track;
      this.current = {
        name: track.name,
        artists: track.artists.map((a) => a.name).join(', '),
        imageUrl: track.album.images[0]?.url ?? null,
      };
      // Mirror what's playing into the store so <top-tracks>/<top-playlists>
      // can show the right play/pause icon for the active row.
      dispatch({
        type: 'setPlayback',
        payload: { currentUri: track.uri, paused: s.paused },
      });
    });

    player.addListener('initialization_error', ({ message }) => {
      this.status = 'error';
      this.errorMessage = message;
    });

    player.addListener('authentication_error', ({ message }) => {
      this.status = 'unauthorized';
      this.errorMessage = message;
    });

    player.addListener('account_error', ({ message }) => {
      this.status = 'premium-required';
      this.errorMessage = message;
    });
    player.addListener('playback_error', ({ message }) => {
      this.errorMessage = message;
    });

    player.connect();
    this.player = player;
    // Share the instance so the lists can toggle play/pause on it.
    setActivePlayer(player);
  }

  private togglePlay = (): void => {
    this.player?.togglePlay();
  };

  // Prev/next navigate the user's fetched tracks list (from the store),
  // not the SDK's internal queue.
  private next = (): void => {
    playNext();
  };

  private prev = (): void => {
    playPrev();
  };

  override render() {
    switch (this.status) {
      case 'unauthorized':
        return nothing;
      case 'premium-required':
        return html`<div class="msg">
          The Web Playback SDK requires Spotify Premium.
        </div>`;
      case 'error':
        return html`<div class="msg">
          Player error${this.errorMessage ? `: ${this.errorMessage}` : ''}.
        </div>`;
      case 'connecting':
        return html`<div class="msg">Connecting player…</div>`;
    }

    const { items, currentIndex } = this.tracks.value;
    const canPrev = currentIndex > 0;
    const canNext = items.length > 0 && currentIndex < items.length - 1;

    return html`
      <div class="player">
        ${this.current
        ? html`
              ${this.current.imageUrl
            ? html`<img src=${this.current.imageUrl} alt="" />`
            : nothing}
              <div class="meta">
                <div class="name">${this.current.name}</div>
                <div class="sub">${this.current.artists}</div>
              </div>
            `
        : html`<div class="meta">
              <div class="sub">Ready — select a track to start listening</div>
            </div>`}
        <div class="controls">
          <button @click=${this.prev} aria-label="Previous" ?disabled=${!canPrev}>
            ${prevIcon}
          </button>
          <button @click=${this.togglePlay} aria-label="Play or pause">
            ${this.paused ? playIcon : pauseIcon}
          </button>
          <button @click=${this.next} aria-label="Next" ?disabled=${!canNext}>
            ${nextIcon}
          </button>
        </div>
      </div>
    `;
  }
}
