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
    border-left: 2px solid #eee;
    /* The shared 'ol' rule sets width: 100%; combined with this 2.25rem left
       margin it overflows the row — most visible on mobile, where it shoved the
       nested rows past the viewport and knocked their columns/subtitles out of
       alignment. Size the nested list to the remaining width instead. */
    width: auto;
  }
`;

// Shared top-list base first, then the playlist-only extras layered on top.
export const styles = [topListStyles, playlistStyles];
