import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styles } from './loading-spinner-css';

declare global {
  interface HTMLElementTagNameMap {
    'loading-spinner': LoadingSpinner;
  }
}

/** <loading-spinner> — a CSS-only spinner with an optional label below it. */
@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  static override styles = [styles];

  /** Optional caption shown under the spinner (e.g. "3/6 loaded"). */
  @property() label = '';

  override render() {
    return html`
      <div class="spinner" role="status" aria-label="Loading"></div>
      ${this.label ? html`<div class="label">${this.label}</div>` : nothing}
    `;
  }
}
