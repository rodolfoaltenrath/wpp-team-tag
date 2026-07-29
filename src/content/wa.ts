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

export const SEND_BUTTON_SELECTOR =
  '[data-testid="compose-btn-send"], button[aria-label="Enviar"], button[aria-label="Send"], button[aria-label*="enviar" i], button[aria-label*="send" i], [role="button"][aria-label*="enviar" i], [role="button"][aria-label*="send" i], button[data-testid="send"], [role="button"][title="Enviar"], [role="button"][title="Send"], [role="button"][title*="enviar" i], [role="button"][title*="send" i], [data-icon="send"], [data-icon*="send" i], span[data-icon="send"], span[data-icon*="send" i]';

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
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

export function isConversationComposer(composer: HTMLElement | null): boolean {
  const footer = composer?.closest("footer");

  return Boolean(footer && !isAttachmentContext(footer, composer));
}

export function findConversationComposerNearElement(
  element: Element | null,
): HTMLElement | null {
  const footer = element?.closest<HTMLElement>("footer");

  if (!footer || isAttachmentContext(element, null)) {
    return null;
  }

  return getVisibleComposers(footer).find(isConversationComposer) ?? null;
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

// Le o texto visivel do composer e normaliza quebras de linha.
export function readComposerText(composer: HTMLElement): string {
  return composer.innerText.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
}
