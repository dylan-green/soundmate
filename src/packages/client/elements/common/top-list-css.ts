import { css } from 'lit';

/**
 * Shared list/row styling for the `<top-*>` tab elements, derived from
 * `<top-tracks>` (the canonical base). Every top tab consumes these so theming,
 * alignment, justification, and padding stay consistent across tabs. Elements
 * that need extras (e.g. `<top-playlists>` expand/nested rows) layer their own
 * styles on top: `static override styles = [topListStyles, styles]`.
 */
export const topListStyles = css`
  :host {
    display: flex;
    justify-content: center;
  }
  :host([hidden]) {
    display: none;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    /* Fixed list width so every tab renders an identical, centered list — the
       column is up to 90vw wide, so without this a single long title would
       stretch the list to full width and shove the play buttons to the edge. */
    width: 100%;
    max-width: 32rem;
    box-sizing: border-box;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0;
  }

  /* The title/subtitle column. min-width: 0 lets it shrink below its content so
     long titles wrap (and the play button stays put) instead of widening the row. */
  li > span:not(.rank) {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .rank {
    width: 1.5rem;
    color: #999;
    text-align: right;
  }

  img {
    width: 48px;
    height: 48px;
    border-radius: 0.25rem;
    object-fit: cover;
    background: #eee;
  }

  a {
    color: inherit;
    text-decoration: none;
    font-weight: 600;
  }

  a:hover {
    text-decoration: underline;
  }

  .sub {
    color: #666;
    font-size: 0.85rem;
    line-height: 1.2;
    /* Reserve a line even when the subtitle is empty, so rows stay aligned. */
    min-height: 1.2em;
  }

  .play {
    margin-left: auto;
    flex: none;
    width: 2rem;
    height: 2rem;
    border: 1.5px solid rgb(204, 204, 204);
    border-radius: 50%;
    background: #fff;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .play svg {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    flex: none;
  }
  .play:hover {
    background: #1db954;
    border-color: #1db954;
    color: #fff;
  }

  .msg {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: #f3f3f3;
  }
`;
