import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    margin-top: 1rem;
  }
  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background: #1db954;
    color: #fff;
    font: inherit;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    max-width: 32rem;
  }
  .row input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    font: inherit;
  }
  .hint {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #666;
  }
  .error {
    margin-top: 0.5rem;
    color: #c0392b;
  }
`;
