import {
  DEFAULT_PROFILE_ID,
  cloneDefaultProfiles,
  getEffectiveProfileName,
  isKnownProfileId,
  normalizeProfiles,
} from "../shared/profiles";
import { getProfile, getProfiles, PROFILES_STORAGE_KEY, STORAGE_KEY } from "../shared/storage";
import {
  PAGE_BRIDGE_READY_EVENT,
  PAGE_BRIDGE_REQUEST_EVENT,
  PAGE_BRIDGE_RESPONSE_EVENT,
  type PageBridgeReadyMessage,
  type PageBridgeRequestMessage,
  type PageBridgeResponseMessage,
} from "../shared/wppBridge";
import { canInterceptSend } from "./interception";
import { buildOutgoingMessage } from "./message";
import { injectRuntime } from "./runtimeInjection";
import {
  findConversationComposerNearElement,
  findComposerForTarget,
  isAttachmentContext,
  isConversationComposer,
  isReplyContext,
  readComposerText,
  SEND_BUTTON_SELECTOR,
} from "./wa";

const REQUEST_TIMEOUT_MS = 8_000;

let currentProfileId = DEFAULT_PROFILE_ID;
let currentProfiles = cloneDefaultProfiles();
let isSending = false;
let requestCounter = 0;
let runtimeInjectionPromise: Promise<void> | null = null;
let runtimeReady = false;

function getCurrentProfileName(): string {
  const profile = currentProfiles.find(({ id }) => id === currentProfileId);
  return getEffectiveProfileName(profile ?? currentProfiles[0]);
}

function nextRequestId(): string {
  requestCounter += 1;
  return `${Date.now()}-${requestCounter}`;
}

function ensureRuntime(): Promise<void> {
  if (!runtimeInjectionPromise) {
    runtimeInjectionPromise = injectRuntime().catch((error) => {
      runtimeInjectionPromise = null;
      throw error;
    });
  }

  return runtimeInjectionPromise;
}

function requestSend(
  message: string,
  useActiveQuote: boolean,
): Promise<PageBridgeResponseMessage["payload"]> {
  return new Promise((resolve, reject) => {
    const requestId = nextRequestId();

    const handleResponse = (event: MessageEvent<PageBridgeResponseMessage>): void => {
      if (
        event.source !== window ||
        event.data?.source !== "wpp-team-tag" ||
        event.data.type !== PAGE_BRIDGE_RESPONSE_EVENT ||
        event.data.payload.requestId !== requestId
      ) {
        return;
      }

      cleanup();
      resolve(event.data.payload);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado aguardando o envio pelo WhatsApp."));
    }, REQUEST_TIMEOUT_MS);

    const cleanup = (): void => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleResponse);
    };

    window.addEventListener("message", handleResponse);

    const request: PageBridgeRequestMessage = {
      source: "wpp-team-tag",
      type: PAGE_BRIDGE_REQUEST_EVENT,
      payload: { requestId, message, useActiveQuote },
    };
    window.postMessage(request, "*");
  });
}

async function sendFromComposer(
  composer: HTMLElement,
  useActiveQuote: boolean,
): Promise<void> {
  if (isSending) {
    return;
  }

  const message = readComposerText(composer).trim();

  if (!message) {
    return;
  }

  isSending = true;

  try {
    await ensureRuntime();

    const outgoingMessage = buildOutgoingMessage(
      message,
      getCurrentProfileName(),
      currentProfiles,
    );
    const response = await requestSend(outgoingMessage, useActiveQuote);

    if (!response.ok) {
      console.error("[wpp-team-tag] envio recusado", response.error);
    }
  } catch (error) {
    console.error("[wpp-team-tag] falha no bridge", error);
  } finally {
    isSending = false;
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  // Nao bloqueia o envio nativo se o WA-JS ainda estiver carregando ou falhar.
  if (!canInterceptSend(runtimeReady)) {
    return;
  }

  const target = event.target;
  const composer = findComposerForTarget(target);

  if (
    !(target instanceof Node) ||
    !composer ||
    !composer.contains(target) ||
    !isConversationComposer(composer) ||
    isAttachmentContext(target instanceof Element ? target : null, composer)
  ) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!isSending) {
    void sendFromComposer(
      composer,
      isReplyContext(target instanceof Element ? target : null, composer),
    );
  }
}

function handleClick(event: MouseEvent): void {
  // Mantem o WhatsApp utilizavel mesmo se a integracao nao inicializar.
  if (!canInterceptSend(runtimeReady)) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLElement>("button, [role='button']");

  if (
    !button ||
    (!button.matches(SEND_BUTTON_SELECTOR) && !button.querySelector(SEND_BUTTON_SELECTOR))
  ) {
    return;
  }

  const composer = findConversationComposerNearElement(button);

  if (!composer || isAttachmentContext(button, composer)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!isSending) {
    void sendFromComposer(composer, isReplyContext(button, composer));
  }
}

function registerRuntimeReadyListener(): void {
  window.addEventListener("message", (event: MessageEvent<PageBridgeReadyMessage>) => {
    if (
      event.source === window &&
      event.data?.source === "wpp-team-tag" &&
      event.data.type === PAGE_BRIDGE_READY_EVENT
    ) {
      runtimeReady = true;
    }
  });
}

function registerStorageListener(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[STORAGE_KEY]) {
      const profileId = changes[STORAGE_KEY].newValue;
      currentProfileId =
        typeof profileId === "string" && isKnownProfileId(profileId)
          ? profileId
          : DEFAULT_PROFILE_ID;
    }

    if (changes[PROFILES_STORAGE_KEY]) {
      currentProfiles = normalizeProfiles(changes[PROFILES_STORAGE_KEY].newValue);
    }
  });
}

function syncStoredConfiguration(): void {
  void Promise.all([getProfile(), getProfiles()])
    .then(([profileId, profiles]) => {
      currentProfileId = profileId;
      currentProfiles = profiles;
    })
    .catch((error) => {
      console.error("[wpp-team-tag] falha ao ler a configuracao", error);
    });
}

function init(): void {
  registerRuntimeReadyListener();
  registerStorageListener();
  window.addEventListener("keydown", handleKeydown, true);
  window.addEventListener("click", handleClick, true);
  syncStoredConfiguration();

  // No Firefox isto injeta o bundle; no Chromium apenas prepara a mesma rotina.
  void ensureRuntime().catch((error) => {
    console.error("[wpp-team-tag] falha ao preparar o runtime", error);
  });
}

init();
