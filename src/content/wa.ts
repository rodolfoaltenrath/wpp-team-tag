const COMPOSER_SELECTORS = [
  'footer [contenteditable="true"][role="textbox"]',
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"][data-tab="10"]',
  '[contenteditable="true"][data-tab="9"]',
  '[contenteditable="true"][data-tab="6"]',
  "div[contenteditable='true']",
  "[contenteditable='true']",
];

export const SEND_BUTTON_SELECTOR =
  '[data-testid="compose-btn-send"], button[aria-label="Enviar"], button[aria-label="Send"], button[data-testid="send"], [role="button"][title="Enviar"], [role="button"][title="Send"], [data-icon="send"], span[data-icon="send"]';

function isVisible(element: HTMLElement): boolean {
  return element.offsetParent !== null || element.isContentEditable || element.offsetHeight > 0;
}

// Localiza o composer visivel do WhatsApp Web.
export function findComposer(): HTMLElement | null {
  for (const selector of COMPOSER_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);

    if (element && isVisible(element)) {
      return element;
    }
  }

  return null;
}

// Le o texto visivel do composer e normaliza quebras de linha.
export function readComposerText(composer: HTMLElement): string {
  return composer.innerText.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
}
