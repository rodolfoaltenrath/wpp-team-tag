const RUNTIME_INJECTION_MESSAGE = "wpp-team-tag:inject-runtime";

browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== RUNTIME_INJECTION_MESSAGE) {
    return undefined;
  }

  const tabId = sender.tab?.id;

  if (tabId === undefined || typeof message.runtimeScript !== "string") {
    return Promise.resolve({
      ok: false,
      error: "A aba do WhatsApp ou o runtime nao foi identificado.",
    });
  }

  return browser.scripting
    .executeScript({
      target: {
        tabId,
        frameIds: [sender.frameId ?? 0],
      },
      files: [message.runtimeScript],
      world: "MAIN",
    })
    .then(
      () => ({ ok: true }),
      (error) => ({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
});
