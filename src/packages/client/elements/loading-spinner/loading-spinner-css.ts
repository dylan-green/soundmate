import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 0;
  }

  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 3px solid #e6e6e6;
    border-top-color: #1db954;
    animation: spin 0.8s linear infinite;
  }

  .label {
    color: #666;
    font-size: 0.9rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect users who prefer reduced motion: show a static ring. */
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
`;
