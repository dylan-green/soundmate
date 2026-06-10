import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createInvite } from '../../functions/invite';
import { styles } from './invite-link-css';

declare global {
  interface HTMLElementTagNameMap {
    'invite-link': InviteLink;
  }
}

/**
 * <invite-link> — lets an authenticated user generate a shareable link that adds
 * whoever opens it (after a Spotify login) to their soundmate group. Renders a
 * button; once clicked it shows the URL with a copy control. See
 * functions/invite.ts → POST /session/invite.
 */
@customElement('invite-link')
export class InviteLink extends LitElement {
  static override styles = [styles];

  @state() private url: string | null = null;
  @state() private busy = false;
  @state() private error: string | null = null;
  @state() private copied = false;

  private async generate(): Promise<void> {
    this.busy = true;
    this.error = null;
    this.copied = false;
    try {
      const { url } = await createInvite();
      this.url = url;
    } catch {
      this.error = 'Could not create an invite link. Try again.';
    } finally {
      this.busy = false;
    }
  }

  private async copy(): Promise<void> {
    if (!this.url) return;
    try {
      await navigator.clipboard.writeText(this.url);
      this.copied = true;
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — the input is
      // selectable as a fallback, so just leave the link visible.
    }
  }

  override render() {
    return html`
      <button class="btn" ?disabled=${this.busy} @click=${this.generate}>
        ${this.url ? 'New invite link' : 'Invite a soundmate'}
      </button>
      ${this.url
        ? html`
            <div class="row">
              <input type="text" readonly .value=${this.url} @focus=${this.#selectAll} />
              <button class="btn" @click=${this.copy}>
                ${this.copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p class="hint">
              Send this link to a friend. After they log in with Spotify, you'll
              both see each other's music. It works for a couple of hours.
            </p>
          `
        : nothing}
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
    `;
  }

  #selectAll(e: FocusEvent): void {
    (e.target as HTMLInputElement).select();
  }
}
