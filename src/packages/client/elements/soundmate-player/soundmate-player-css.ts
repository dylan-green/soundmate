import { css } from 'lit';

export const styles = css`
  :host {
    position: fixed;
    bottom: 0px;
    width: 70vw;
    background: rgba(238, 238, 238, 0.95);
    border-radius: 8px;
    left: 50%;
    transform: translateX(-50%);
  }

  .player {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #eee;
    border-radius: 0.75rem;
  }

  img {
    width: 56px;
    height: 56px;
    border-radius: 0.25rem;
    object-fit: cover;
    background: #eee;
  }

  .meta {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub {
    color: #666;
    font-size: 0.85rem;
  }

  .controls {
    display: flex;
    gap: 0.25rem;
  }

  .controls button {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 999px;
    width: 2.25rem;
    height: 2.25rem;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .controls button svg {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    /* Without this, the SVG's flex-basis collapses to 0 width in the flex
       button (Chrome bug with viewBox-only SVGs). */
    flex: none;
  }

  .controls button:hover:not(:disabled) {
    background: #f3f3f3;
  }

  .controls button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .msg {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: #f3f3f3;
  }

  .attr {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #999;
  }
`;
