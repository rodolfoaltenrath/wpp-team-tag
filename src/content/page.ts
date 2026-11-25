import {
  PAGE_BRIDGE_READY_EVENT,
  PAGE_BRIDGE_REQUEST_EVENT,
  PAGE_BRIDGE_RESPONSE_EVENT,
  PAGE_BRIDGE_STATUS_EVENT,
  type PageBridgeReadyMessage,
  type PageBridgeRequestDetail,
  type PageBridgeRequestMessage,
  type PageBridgeResponseDetail,
  type PageBridgeResponseMessage,
} from "../shared/wppBridge";

const READY_TIMEOUT_MS = 15_000;
const WARMUP_DELAY_MS = 750;
const WARMUP_RETRY_DELAY_MS = 5_000;
let readyPromise: Promise<WppRuntime> | null = null;
let loaderRequested = false;
let runtimeReady = false;

type ActiveChat = {
  id?: { _serialized?: string } | string;
  composeQuotedMsg?: unknown;
  quotedMsg?: unknown;
  quotedMsgId?: unknown;
  quotedMsgKey?: unknown;
  get?: (key: string) => unknown;
};

type WppModule = typeof import("@wppconnect/wa-js");

type WppRuntime = WppModule & {
  loader?: {
    isInjected?: boolean;
    isReady?: boolean;
    injectLoader?: () => void;
    onReady?: (listener: () => void) => void;
  };
  chat?: {
    getActiveChat: () => ActiveChat | undefined;
    setInputText: (text: string, chatId?: unknown) => Promise<unknown>;
    sendTextMessage: (
      chatId: unknown,
      content: string,
      options?: { quotedMsg?: unknown; waitForAck?: boolean },
    ) => Promise<unknown>;
  };
  isInjected?: boolean;
  isReady?: boolean;
};

function loadRuntime(): Promise<WppRuntime> {
  const pageRuntime = (window as Window & { WPP?: WppRuntime }).WPP;

  if (pageRuntime) {
    return Promise.resolve(pageRuntime);
  }

  return Promise.reject(new Error("WA-JS ainda nao foi injetado."));
}

function isReady(runtime: WppRuntime): boolean {
  return Boolean(runtime.isReady ?? runtime.loader?.isReady);
}

function ensureLoader(runtime: WppRuntime): void {
  if (
    !runtime.isInjected &&
    !runtime.loader?.isInjected &&
    !loaderRequested &&
    runtime.loader?.injectLoader
  ) {
    loaderRequested = true;
    runtime.loader.injectLoader();
  }
}

async function waitForReady(): Promise<WppRuntime> {
  if (readyPromise) {
    return readyPromise;
  }

  const runtime = await loadRuntime();

  if (isReady(runtime)) {
    return runtime;
  }

  ensureLoader(runtime);

  readyPromise = new Promise<WppRuntime>((resolve, reject) => {
    let settled = false;

    const finish = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      resolve(runtime);
    };

    const fail = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      readyPromise = null;
      loaderRequested = false;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      reject(new Error("WA-JS nao ficou pronto a tempo."));
    };

    const timeoutId = window.setTimeout(fail, READY_TIMEOUT_MS);
    const intervalId = window.setInterval(() => {
      if (isReady(runtime)) {
        finish();
      }
    }, 100);

    // O polling e removido no timeout; callbacks onReady nao podem ser removidos.
  });

  return readyPromise;
}

function getChatId(chat: ActiveChat): unknown {
  return typeof chat.id === "string" ? chat.id : chat.id?._serialized ?? chat.id;
}

function getQuotedMessage(chat: ActiveChat): unknown {
  const getValue = (key: string): unknown =>
    chat[key as keyof ActiveChat] ?? chat.get?.(key);

  return (
    getValue("composeQuotedMsg") ??
    getValue("quotedMsg") ??
    getValue("quotedMsgKey") ??
    getValue("quotedMsgId")
  );
}

function respond(payload: PageBridgeResponseDetail): void {
  const response: PageBridgeResponseMessage = {
    source: "wpp-team-tag",
    type: PAGE_BRIDGE_RESPONSE_EVENT,
    payload,
  };
  window.postMessage(response, "*");
}

function announceReady(): void {
  const message: PageBridgeReadyMessage = {
    source: "wpp-team-tag",
    type: PAGE_BRIDGE_READY_EVENT,
  };
  window.postMessage(message, "*");
}

function warmRuntime(): void {
  void waitForReady()
    .then(() => {
      runtimeReady = true;
      announceReady();
    })
    .catch((error) => {
      console.error("[wpp-team-tag] runtime indisponivel", error);

      window.setTimeout(warmRuntime, WARMUP_RETRY_DELAY_MS);
    });
}

function scheduleRuntimeWarmup(): void {
  // Nao depende do evento load nem de um login rapido em uma instalacao nova.
  window.setTimeout(warmRuntime, WARMUP_DELAY_MS);
}

async function sendMessage(request: PageBridgeRequestDetail): Promise<void> {
  try {
    const runtime = await waitForReady();
    const chat = runtime.chat?.getActiveChat() as ActiveChat | undefined;

    if (!runtime.chat || !chat) {
      throw new Error("Nenhum chat ativo encontrado.");
    }

    const chatId = getChatId(chat);

    if (!chatId) {
      throw new Error("Nao foi possivel identificar o chat ativo.");
    }

    const quotedMsg = request.useActiveQuote ? getQuotedMessage(chat) : undefined;
    const options = {
      ...(quotedMsg ? { quotedMsg } : {}),
      waitForAck: false,
    };

    await runtime.chat.sendTextMessage(chatId, request.message, options);
    await runtime.chat.setInputText("", chatId);

    respond({ requestId: request.requestId, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[wpp-team-tag] falha ao enviar", message);
    respond({ requestId: request.requestId, ok: false, error: message });
  }
}

window.addEventListener("message", (event: MessageEvent<PageBridgeRequestMessage>) => {
  if (
    event.source === window &&
    event.data?.source === "wpp-team-tag" &&
    (event.data.type as string) === PAGE_BRIDGE_STATUS_EVENT
  ) {
    if (runtimeReady) announceReady();
    return;
  }
  if (
    event.source !== window ||
    event.data?.source !== "wpp-team-tag" ||
    event.data.type !== PAGE_BRIDGE_REQUEST_EVENT
  ) {
    return;
  }

  void sendMessage(event.data.payload);
});

scheduleRuntimeWarmup();
