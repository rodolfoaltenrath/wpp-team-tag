import * as WPP from "@wppconnect/wa-js";
import {
  PAGE_BRIDGE_REQUEST_EVENT,
  PAGE_BRIDGE_RESPONSE_EVENT,
  type PageBridgeRequestDetail,
  type PageBridgeRequestMessage,
  type PageBridgeResponseDetail,
  type PageBridgeResponseMessage,
} from "../shared/wppBridge";

const READY_TIMEOUT_MS = 10000;
let readyPromise: Promise<void> | null = null;
let loaderRequested = false;

type WppRuntime = typeof WPP & {
  webpack?: {
    isInjected?: boolean;
    isReady?: boolean;
    injectLoader?: () => void;
    onReady?: (listener: () => void, delay?: number) => void;
  };
  chat?: {
    getActiveChat: () => ActiveChatWithId | undefined;
    setInputText: (text: string, chatId?: unknown) => Promise<unknown>;
    sendTextMessage: (chatId: unknown, content: string) => Promise<unknown>;
  };
  isInjected?: boolean;
  isReady?: boolean;
};

type ActiveChatWithId = {
  id?: unknown;
};

function getWppRuntime(): WppRuntime {
  return ((window as Window & { WPP?: WppRuntime }).WPP ?? WPP) as WppRuntime;
}

function getWppReadiness(runtime: WppRuntime): { isInjected: boolean; isReady: boolean } {
  return {
    isInjected: Boolean(runtime.isInjected ?? runtime.webpack?.isInjected),
    isReady: Boolean(runtime.isReady ?? runtime.webpack?.isReady),
  };
}

function resolveChatId(chat: ActiveChatWithId): unknown {
  const id = chat.id as { _serialized?: string } | string | undefined;

  if (typeof id === "string") {
    return id;
  }

  return id?._serialized ?? id;
}

function respond(detail: PageBridgeResponseDetail): void {
  const message: PageBridgeResponseMessage = {
    source: "wpp-team-tag",
    type: PAGE_BRIDGE_RESPONSE_EVENT,
    payload: detail,
  };
  window.postMessage(message, "*");
}

function ensureWppLoaderInjected(): void {
  const runtime = getWppRuntime();
  const readiness = getWppReadiness(runtime);

  if (!readiness.isInjected && !loaderRequested && runtime.webpack?.injectLoader) {
    loaderRequested = true;
    runtime.webpack.injectLoader();
  }
}

async function waitForWppReady(): Promise<void> {
  if (getWppReadiness(getWppRuntime()).isReady) {
    return;
  }

  if (readyPromise) {
    return readyPromise;
  }

  ensureWppLoaderInjected();

  readyPromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      resolve();
    };

    const fail = (error: Error): void => {
      if (settled) {
        return;
      }

      settled = true;
      readyPromise = null;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      reject(error);
    };

    const timeoutId = window.setTimeout(() => {
      fail(new Error("WA-JS nao ficou pronto a tempo."));
    }, READY_TIMEOUT_MS);

    const currentRuntime = getWppRuntime();
    currentRuntime.webpack?.onReady?.(() => {
      finish();
    });

    const intervalId = window.setInterval(() => {
      if (getWppReadiness(getWppRuntime()).isReady) {
        finish();
      }
    }, 100);

    if (getWppReadiness(getWppRuntime()).isReady) {
      finish();
    }
  });

  return readyPromise;
}

async function handleBridgeRequest(detail: PageBridgeRequestDetail): Promise<void> {
  try {
    await waitForWppReady();

    const runtime = getWppRuntime();

    if (!runtime.chat) {
      throw new Error("WA-JS chat API indisponivel.");
    }

    const activeChat = runtime.chat.getActiveChat() as ActiveChatWithId | undefined;

    if (!activeChat) {
      throw new Error("Nenhum chat ativo encontrado.");
    }

    const chatId = resolveChatId(activeChat);

    if (!chatId) {
      throw new Error("Nao foi possivel resolver o ID do chat ativo.");
    }

    await runtime.chat.setInputText("", chatId);
    await runtime.chat.sendTextMessage(chatId, detail.message);

    respond({
      requestId: detail.requestId,
      ok: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("[wpp-team-tag] page bridge error", message);
    respond({
      requestId: detail.requestId,
      ok: false,
      error: message,
    });
  }
}

ensureWppLoaderInjected();

window.addEventListener("message", (event: MessageEvent<PageBridgeRequestMessage>) => {
  if (event.source !== window || !event.data || event.data.source !== "wpp-team-tag") {
    return;
  }

  if (event.data.type !== PAGE_BRIDGE_REQUEST_EVENT) {
    return;
  }

  void handleBridgeRequest(event.data.payload);
});
