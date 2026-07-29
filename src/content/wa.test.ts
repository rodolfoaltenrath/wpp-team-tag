import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findConversationComposerNearElement,
  isConversationComposer,
} from "./wa";

function makeVisible(element: HTMLElement): void {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    bottom: 40,
    height: 40,
    left: 0,
    right: 200,
    top: 0,
    width: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("composer da conversa", () => {
  it("localiza somente o composer no mesmo rodape do botao", () => {
    document.body.innerHTML = `
      <footer>
        <div contenteditable="true" role="textbox"></div>
        <button aria-label="Enviar"></button>
      </footer>
    `;

    const composer = document.querySelector<HTMLElement>('[contenteditable="true"]')!;
    const button = document.querySelector("button")!;
    makeVisible(composer);

    expect(findConversationComposerNearElement(button)).toBe(composer);
    expect(isConversationComposer(composer)).toBe(true);
  });

  it("ignora o botao de envio de anexos fora da conversa", () => {
    document.body.innerHTML = `
      <div role="dialog">
        <div contenteditable="true" role="textbox"></div>
        <button aria-label="Enviar"></button>
      </div>
    `;

    const composer = document.querySelector<HTMLElement>('[contenteditable="true"]')!;
    const button = document.querySelector("button")!;
    makeVisible(composer);

    expect(findConversationComposerNearElement(button)).toBeNull();
    expect(isConversationComposer(composer)).toBe(false);
  });

  it("ignora anexos mesmo quando a previa possui um rodape", () => {
    document.body.innerHTML = `
      <div aria-modal="true">
        <footer>
          <div contenteditable="true" role="textbox"></div>
          <button aria-label="Enviar"></button>
        </footer>
      </div>
    `;

    const composer = document.querySelector<HTMLElement>('[contenteditable="true"]')!;
    const button = document.querySelector("button")!;
    makeVisible(composer);

    expect(findConversationComposerNearElement(button)).toBeNull();
    expect(isConversationComposer(composer)).toBe(false);
  });
});
