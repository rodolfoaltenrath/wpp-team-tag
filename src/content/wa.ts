const COMPOSER_SELECTOR = 'footer [contenteditable="true"][role="textbox"]';
const SEND_ICON_SELECTOR = "[data-icon='send']";

// Localiza o campo principal de composicao do WhatsApp Web dentro do rodape do chat.
export function findComposer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(COMPOSER_SELECTOR);
}

// Localiza o botao de envio visivel do chat atual.
export function findSendButton(): HTMLElement | null {
  const sendIcon = document.querySelector<HTMLElement>(SEND_ICON_SELECTOR);
  return sendIcon?.closest("button, [role='button']") as HTMLElement | null;
}

// Le o texto visivel do composer e normaliza espacos/quebras para facilitar o prefixo.
export function readComposerText(composer: HTMLElement): string {
  return composer.innerText.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
}

// Posiciona o cursor no final apos reescrever o conteudo do contenteditable.
function moveCursorToEnd(element: HTMLElement): void {
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

// Reescreve o texto do composer preservando quebras de linha e disparando input para o app reagir.
export function writeComposerText(composer: HTMLElement, text: string): void {
  composer.focus();

  // Tenta usar execCommand porque muitos editores rich text ainda sincronizam melhor por ele.
  const selection = window.getSelection();

  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(composer);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const inserted = document.execCommand("insertText", false, text);

  if (!inserted) {
    const lines = text.split("\n");
    composer.replaceChildren();

    lines.forEach((line, index) => {
      composer.append(document.createTextNode(line));

      if (index < lines.length - 1) {
        composer.append(document.createElement("br"));
      }
    });

    moveCursorToEnd(composer);
    composer.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
      }),
    );
    return;
  }

  moveCursorToEnd(composer);
}
