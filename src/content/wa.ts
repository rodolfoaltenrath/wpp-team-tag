const COMPOSER_SELECTORS = [
  'footer [contenteditable="true"][role="textbox"]',
  'footer [contenteditable="true"][aria-label*="mensagem" i]',
  'footer [contenteditable="true"][aria-label*="message" i]',
  'footer [contenteditable="true"][aria-placeholder*="mensagem" i]',
  'footer [contenteditable="true"][aria-placeholder*="message" i]',
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"][aria-label*="mensagem" i]',
  '[contenteditable="true"][aria-label*="message" i]',
  '[contenteditable="true"][aria-placeholder*="mensagem" i]',
  '[contenteditable="true"][aria-placeholder*="message" i]',
  '[contenteditable="true"][data-tab="10"]',
  '[contenteditable="true"][data-tab="9"]',
  '[contenteditable="true"][data-tab="6"]',
  "div[contenteditable='true']",
  "[contenteditable='true']",
];

const COMPOSER_SELECTOR = COMPOSER_SELECTORS.join(",");

const ATTACHMENT_CONTEXT_SELECTOR = [
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[data-animate-modal-popup="true"]',
  '[data-testid*="media"]',
  '[data-testid*="attach"]',
].join(",");

const REPLY_CONTEXT_SELECTOR = [
  '[data-testid="quoted-message"]',
  '[data-testid="quoted_msg"]',
  '[data-testid*="quoted"]',
  '[data-testid*="quoted-msg"]',
].join(",");

const REPLY_CANCEL_BUTTON_SELECTOR = [
  'button[aria-label*="cancel" i]',
  'button[aria-label*="cancelar" i]',
  'button[aria-label*="close" i]',
  'button[aria-label*="fechar" i]',
  '[role="button"][aria-label*="cancel" i]',
  '[role="button"][aria-label*="cancelar" i]',
  '[role="button"][aria-label*="close" i]',
  '[role="button"][aria-label*="fechar" i]',
  '[data-icon="x"]',
  '[data-icon="x-alt"]',
  '[data-icon="x-viewer"]',
  'span[data-icon="x"]',
  'span[data-icon="x-alt"]',
  'span[data-icon="x-viewer"]',
].join(",");

export const SEND_BUTTON_SELECTOR =
  '[data-testid="compose-btn-send"], button[aria-label="Enviar"], button[aria-label="Send"], button[aria-label*="enviar" i], button[aria-label*="send" i], [role="button"][aria-label*="enviar" i], [role="button"][aria-label*="send" i], button[data-testid="send"], [role="button"][title="Enviar"], [role="button"][title="Send"], [role="button"][title*="enviar" i], [role="button"][title*="send" i], [data-icon="send"], [data-icon*="send" i], span[data-icon="send"], span[data-icon*="send" i]';

function isVisible(element: HTMLElement): boolean {
  return element.offsetParent !== null || element.isContentEditable || element.offsetHeight > 0;
}

function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return [...new Set(elements)];
}

function getVisibleComposers(root: ParentNode = document): HTMLElement[] {
  const composers = COMPOSER_SELECTORS.flatMap((selector) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector)),
  );

  return uniqueElements(composers).filter(isVisible);
}

function getElementCenter(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getDistanceScore(from: Element, to: Element): number {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  if (!fromRect.width && !fromRect.height) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (!toRect.width && !toRect.height) {
    return Number.MAX_SAFE_INTEGER;
  }

  const fromCenter = getElementCenter(from);
  const toCenter = getElementCenter(to);
  const x = fromCenter.x - toCenter.x;
  const y = fromCenter.y - toCenter.y;

  return Math.sqrt(x * x + y * y);
}

function getSharedContextScore(element: Element, composer: HTMLElement): number {
  const contextSelectors = [ATTACHMENT_CONTEXT_SELECTOR, "footer"];

  for (const selector of contextSelectors) {
    const elementContext = element.closest(selector);
    const composerContext = composer.closest(selector);

    if (elementContext && elementContext === composerContext) {
      return -100000;
    }
  }

  return 0;
}

function placeCaretAtEnd(element: HTMLElement): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function isQueryableContext(context: Element | Document | null): context is Element | Document {
  return Boolean(context);
}

function dispatchComposerInput(composer: HTMLElement): void {
  composer.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertReplacementText",
    }),
  );
}

// Localiza o composer visivel do WhatsApp Web.
export function findComposer(): HTMLElement | null {
  return getVisibleComposers()[0] ?? null;
}

export function findComposerNearElement(element: Element | null): HTMLElement | null {
  if (!element) {
    return findComposer();
  }

  const ownComposer = element.closest<HTMLElement>(COMPOSER_SELECTOR);

  if (ownComposer && isVisible(ownComposer)) {
    return ownComposer;
  }

  const composers = getVisibleComposers();

  if (!composers.length) {
    return null;
  }

  return composers
    .map((composer) => ({
      composer,
      score: getSharedContextScore(element, composer) + getDistanceScore(element, composer),
    }))
    .sort((a, b) => a.score - b.score)[0].composer;
}

export function findComposerForTarget(target: EventTarget | null): HTMLElement | null {
  return findComposerNearElement(target instanceof Element ? target : null);
}

export function isAttachmentContext(element: Element | null, composer: HTMLElement | null): boolean {
  return Boolean(
    element?.closest(ATTACHMENT_CONTEXT_SELECTOR) || composer?.closest(ATTACHMENT_CONTEXT_SELECTOR),
  );
}

export function isReplyContext(element: Element | null, composer: HTMLElement | null): boolean {
  const contexts = [element?.closest("footer"), composer?.closest("footer")];

  return contexts.some((context) => {
    const replyPreview = context?.querySelector<HTMLElement>(REPLY_CONTEXT_SELECTOR);

    return Boolean(replyPreview && isVisible(replyPreview) && !composer?.contains(replyPreview));
  });
}

export function findSendButtonNearElement(element: Element | null): HTMLElement | null {
  if (!element) {
    return document.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR);
  }

  const contexts = [
    element.closest(ATTACHMENT_CONTEXT_SELECTOR),
    element.closest("footer"),
    document,
  ].filter(isQueryableContext);

  for (const context of contexts) {
    const button = context.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR);

    if (button && isVisible(button)) {
      return button.closest<HTMLElement>("button, [role='button']") ?? button;
    }
  }

  return null;
}

export function dismissReplyContext(composer: HTMLElement | null): boolean {
  const footer = composer?.closest("footer") ?? document.querySelector("footer");

  if (!footer?.querySelector(REPLY_CONTEXT_SELECTOR)) {
    return false;
  }

  const candidates = Array.from(
    footer.querySelectorAll<HTMLElement>(REPLY_CANCEL_BUTTON_SELECTOR),
  ).filter(isVisible);
  const cancelButton = candidates
    .map((candidate) => candidate.closest<HTMLElement>("button, [role='button']") ?? candidate)
    .find((candidate) => footer.contains(candidate));

  if (!cancelButton) {
    return false;
  }

  cancelButton.click();
  return true;
}

// Le o texto visivel do composer e normaliza quebras de linha.
export function readComposerText(composer: HTMLElement): string {
  return composer.innerText.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
}

export function writeComposerText(composer: HTMLElement, text: string): boolean {
  composer.focus();

  const dataTransfer = new DataTransfer();
  dataTransfer.setData("text/plain", text);

  const pasteEvent = new ClipboardEvent("paste", {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });

  composer.dispatchEvent(pasteEvent);

  dispatchComposerInput(composer);
  placeCaretAtEnd(composer);

  return readComposerText(composer).trim() === text.trim();
}