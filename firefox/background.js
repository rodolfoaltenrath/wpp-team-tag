const RUNTIME_INJECTION_MESSAGE = "wpp-team-tag:inject-runtime";

const extensionApi = globalThis.browser ?? globalThis.chrome;

extensionApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== RUNTIME_INJECTION_MESSAGE) {
    return undefined;
  }

  const tabId = sender.tab?.id;

  if (tabId === undefined || typeof message.runtimeScript !== "string") {
    sendResponse({
      ok: false,
      error: "A aba do WhatsApp ou o runtime nao foi identificado.",
    });
    return false;
  }

  const result = extensionApi.scripting
    .executeScript({
      target: {
        tabId,
        frameIds: [sender.frameId ?? 0],
      },
      files: [message.runtimeScript],
      world: "MAIN",
    })
    .then(() => extensionApi.scripting.executeScript({
      target: { tabId, frameIds: [sender.frameId ?? 0] },
      world: "MAIN",
      func: () => Boolean(window.WPP),
    }))
    .then(
      (results) => results.some(({ result }) => result === true)
        ? { ok: true }
        : { ok: false, error: "O script executou, mas o WA-JS nao ficou disponivel na pagina." },
      (error) => ({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  // sendResponse tambem funciona em versoes do Chromium sem retorno de Promise.
  result.then(sendResponse);
  return true;
});
