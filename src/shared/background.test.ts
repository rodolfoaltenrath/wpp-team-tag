// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("firefox/background.js", "utf8");

function setup(namespace: "browser" | "chrome", runtimePresent: boolean) {
  let listener: (message: unknown, sender: unknown, reply: (value: unknown) => void) => unknown;
  const executeScript = vi.fn(async (params: { files?: string[]; func?: () => unknown }) => params.files
    ? [{ frameId: 0, result: undefined }]
    : [{ frameId: 0, result: params.func?.() }]);
  const api = {
    runtime: { onMessage: { addListener: (callback: typeof listener) => { listener = callback; } } },
    scripting: { executeScript },
  };
  runInNewContext(source, { [namespace]: api, window: { WPP: runtimePresent ? {} : undefined } });
  return {
    executeScript,
    request: () => new Promise((resolve) => {
      const result = listener({
        type: "wpp-team-tag:inject-runtime", runtimeScript: "src/content/runtime.js",
      }, { tab: { id: 10 }, frameId: 0 }, resolve);
      expect(result).toBe(true);
    }),
  };
}

describe("confirmacao da injecao do runtime", () => {
  it.each(["browser", "chrome"] as const)("confirma o global WPP usando %s", async (namespace) => {
    const background = setup(namespace, true);
    expect(await background.request()).toEqual({ ok: true });
    expect(background.executeScript).toHaveBeenCalledTimes(2);
  });

  it("recusa falso sucesso quando executeScript resolve sem disponibilizar WPP", async () => {
    const background = setup("chrome", false);
    expect(await background.request()).toEqual({
      ok: false, error: "O script executou, mas o WA-JS nao ficou disponivel na pagina.",
    });
  });
});
