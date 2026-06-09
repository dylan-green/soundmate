import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    font-family: system-ui, sans-serif;
    max-width: 90vw;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  h1 {
    margin-bottom: 0.25rem;
  }

  p.sub {
    color: #666;
    margin-top: 0;
  }

  a.btn {
    display: inline-block;
    background: #1db954;
    color: #fff;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    font-weight: 600;
    margin-top: 1rem;
  }
    
  a.btn:hover {
    background: #1ed760;
  }
`;
