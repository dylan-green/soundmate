import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    margin-top: 2rem;
    margin-bottom: 1rem;
    align-self: stretch;
  }

  .tabs {
    display: flex;
    min-width: max-content;
    gap: 0.5rem;
    margin-bottom: 1rem;
    justify-content: center;
  }

  button {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 1rem;
    cursor: pointer;
    font: inherit;
  }

  button[aria-pressed='true'] {
    background: #1db954;
    border-color: #1db954;
    color: #fff;
    font-weight: 600;
  }
`;
