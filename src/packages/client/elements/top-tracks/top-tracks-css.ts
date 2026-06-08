import { css } from 'lit';

export const styles = css`
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
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0;
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
