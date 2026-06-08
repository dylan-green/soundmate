import { css } from 'lit';
import { topListStyles } from '../common/top-list-css';

/** Extras unique to `<top-playlists>`: the expand caret and nested track list. */
const playlistStyles = css`
  /* Expand/collapse caret on a playlist row. */
  .expand {
    flex: none;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: #666;
    line-height: 1;
    cursor: pointer;
  }
  .expand:hover {
    background: #eee;
  }

  /* The expanded track list nested under a playlist row. */
  .playlist-tracks {
    display: block;
    padding: 0;
  }
  ol.nested {
    margin: 0 0 0.5rem 2.25rem;
    padding-left: 0.75rem;
    border-left: 2px solid #eee;
  }
  ol.nested .rank {
    width: 1.5rem;
  }
  ol.nested img {
    width: 36px;
    height: 36px;
  }
`;

// Shared top-list base first, then the playlist-only extras layered on top.
export const styles = [topListStyles, playlistStyles];
