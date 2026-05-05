import {
  DEFAULT_PROFILE_ID,
  cloneDefaultProfiles,
  getEffectiveProfileName,
  isKnownProfileId,
  normalizeProfiles,
  type Profile,
} from "../shared/profiles";
import { getProfile, getProfiles, PROFILES_STORAGE_KEY, STORAGE_KEY } from "../shared/storage";
import {
  PAGE_BRIDGE_REQUEST_EVENT,
  PAGE_BRIDGE_RESPONSE_EVENT,
  type PageBridgeRequestDetail,
  type PageBridgeRequestMessage,
  type PageBridgeResponseDetail,
  type PageBridgeResponseMessage,
} from "../shared/wppBridge";
import {
  dismissReplyContext,
  findComposer,
  findComposerForTarget,
  findComposerNearElement,
  findSendButtonNearElement,
  isAttachmentContext,
  isReplyContext,
  readComposerText,
  SEND_BUTTON_SELECTOR,
  writeComposerText,
} from "./wa";

let currentProfileId = DEFAULT_PROFILE_ID;
let currentProfiles = cloneDefaultProfiles();
let isSending = false;
let isNativeRetry = false;
let requestCounter = 0;

const REQUEST_TIMEOUT_MS = 5000;
const NATIVE_SEND_DELAY_MS = 200;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKnownPrefixPattern(profiles: readonly Profile[]): RegExp {
  const profileNames = profiles
    .map((profile) => escapeRegExp(getEffectiveProfileName(profile)))
    .join("|");

  return new RegExp(
    `^(?:\\*?(?:${profileNames})\\*?:|\\*(?:${profileNames}):\\*)(?:\\s*\\n|\\s*$)`,
  );
}

function getCurrentProfileName(): string {
  const currentProfile = currentProfiles.find((profile) => profile.id === currentProfileId);
  return getEffectiveProfileName(currentProfile ?? currentProfiles[0]);
}

function buildOutgoingMessage(message: string, allowTagOnly = false): string {
  if (buildKnownPrefixPattern(currentProfiles).test(message)) {
    return message;
  }

  if (!message && allowTagOnly) {
    return `*${getCurrentProfileName()}*:`;
  }

  return `*${getCurrentProfileName()}*:\n${message}`;
}

function getMessageFromComposer(composer = findComposer()): string | null {
  if (!composer) {
    return null;
  }

  const text = readComposerText(composer).trim();
  return text || null;
}

function nextRequestId(): string {
  requestCounter += 1;
  return `req-${Date.now()}-${requestCounter}`;
}

function dispatchBridgeRequest(detail: PageBridgeRequestDetail): Promise<PageBridgeResponseDetail> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener("message", handleResponse);
      reject(new Error("Tempo esgotado aguardando resposta do bridge do WhatsApp."));
    }, REQUEST_TIMEOUT_MS);

    const handleResponse = (event: MessageEvent<PageBridgeResponseMessage>): void => {
      if (event.source !== window || !event.data || event.data.source !== "wpp-team-tag") {
        return;
      }

      if (event.data.type !== PAGE_BRIDGE_RESPONSE_EVENT) {
        return;
      }

      if (event.data.payload.requestId !== detail.requestId) {
        return;
      }

      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleResponse);
      resolve(event.data.payload);
    };

    window.addEventListener("message", handleResponse);
    const message: PageBridgeRequestMessage = {
      source: "wpp-team-tag",
      type: PAGE_BRIDGE_REQUEST_EVENT,
      payload: detail,
    };
    window.postMessage(message, "*");
  });
}

async function sendMessageUsingBridge(
  trigger: "enter" | "click",
  options: { composer?: HTMLElement | null; useActiveQuote?: boolean } = {},
): Promise<void> {
  if (isSending) {
    return;
  }

  const currentMessage = getMessageFromComposer(options.composer);

  if (!currentMessage) {
    return;
  }

  isSending = true;

  const requestId = nextRequestId();
  const outgoingMessage = buildOutgoingMessage(currentMessage);

  try {
    const response = await dispatchBridgeRequest({
      requestId,
      message: outgoingMessage,
      useActiveQuote: options.useActiveQuote,
    });

    if (!response.ok) {
      console.error("[wpp-team-tag] bridge error", {
        trigger,
        currentMessage,
        outgoingMessage,
        currentProfileId,
        error: response.error,
      });
    }

    if (response.ok && options.useActiveQuote) {
      dismissReplyContext(options.composer ?? null);
    }
  } catch (error) {
    console.error("[wpp-team-tag] bridge request failed", {
      trigger,
      currentMessage,
      outgoingMessage,
      currentProfileId,
      error,
    });
  } finally {
    isSending = false;
  }
}

function applyTagToComposer(composer: HTMLElement | null, allowTagOnly: boolean): boolean {
  if (!composer) {
    return false;
  }

  const text = readComposerText(composer).trim();

  if (!text && !allowTagOnly) {
    return false;
  }

  const outgoingMessage = buildOutgoingMessage(text, allowTagOnly);

  if (outgoingMessage === text) {
    return false;
  }

  if (!writeComposerText(composer, outgoingMessage)) {
    console.error("[wpp-team-tag] nao foi possivel aplicar a tag antes do envio nativo", {
      text,
      outgoingMessage,
      currentProfileId,
    });

    return false;
  }

  return true;
}

function triggerNativeSend(button: HTMLElement | null): void {
  if (!button) {
    return;
  }

  window.setTimeout(() => {
    isNativeRetry = true;
    button.click();
  }, NATIVE_SEND_DELAY_MS);
}

function isFooterComposer(composer: HTMLElement | null): boolean {
  return Boolean(composer?.closest("footer"));
}

function isAttachmentSendContext(element: Element | null, composer: HTMLElement | null): boolean {
  return Boolean(
    isAttachmentContext(element, composer) ||
      (element && !element.closest("footer")) ||
      (composer && !isFooterComposer(composer)),
  );
}

function getAttachmentComposer(composer: HTMLElement | null): HTMLElement | null {
  if (!composer) {
    return null;
  }

  if (isAttachmentContext(null, composer) || !isFooterComposer(composer)) {
    return composer;
  }

  return null;
}

async function syncInitialState(): Promise<void> {
  const [storedProfileId, storedProfiles] = await Promise.all([getProfile(), getProfiles()]);
  currentProfileId = storedProfileId;
  currentProfiles = storedProfiles;
}

function handleKeydown(event: KeyboardEvent): void {
  if (isSending) {
    return;
  }

  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  const target = event.target;
  const composer = findComposerForTarget(target);

  if (!(target instanceof Node) || !composer || !composer.contains(target)) {
    return;
  }

  const targetElement = target instanceof Element ? target : null;
  const isAttachmentSend = isAttachmentContext(targetElement, composer);
  const isReplySend = isReplyContext(targetElement, composer);
  const isSpecialSend = isAttachmentSend || isReplySend;

  if (!isSpecialSend && !isFooterComposer(composer)) {
    return;
  }

  if (isReplySend && !isAttachmentSend) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void sendMessageUsingBridge("enter", { composer, useActiveQuote: true });
    return;
  }

  if (!isSpecialSend) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void sendMessageUsingBridge("enter");
    return;
  }

  const composerToTag = isAttachmentSend ? getAttachmentComposer(composer) : composer;
  const changed = applyTagToComposer(composerToTag, isAttachmentSend);

  if (!changed) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  triggerNativeSend(findSendButtonNearElement(composerToTag ?? composer));
}

function handleClick(event: MouseEvent): void {
  if (isSending) {
    return;
  }

  if (isNativeRetry) {
    isNativeRetry = false;
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const clickable = target.closest("button, [role='button']");

  if (
    !clickable ||
    (!clickable.matches(SEND_BUTTON_SELECTOR) && !clickable.querySelector(SEND_BUTTON_SELECTOR))
  ) {
    return;
  }

  const composer = findComposerNearElement(clickable);
  const isAttachmentSend = isAttachmentSendContext(clickable, composer);
  const isReplySend = isReplyContext(clickable, composer);
  const isSpecialSend = isAttachmentSend || isReplySend;

  if (isReplySend && !isAttachmentSend) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void sendMessageUsingBridge("click", { composer, useActiveQuote: true });
    return;
  }

  if (!isSpecialSend) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void sendMessageUsingBridge("click");
    return;
  }

  const composerToTag = isAttachmentSend ? getAttachmentComposer(composer) : composer;
  const changed = applyTagToComposer(composerToTag, isAttachmentSend);

  if (!changed) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  triggerNativeSend(
    clickable instanceof HTMLElement ? clickable : findSendButtonNearElement(composerToTag ?? clickable),
  );
}

function registerStorageListener(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[STORAGE_KEY]) {
      const updatedProfileId = changes[STORAGE_KEY].newValue;
      currentProfileId =
        typeof updatedProfileId === "string" && isKnownProfileId(updatedProfileId)
          ? updatedProfileId
          : DEFAULT_PROFILE_ID;
    }

    if (changes[PROFILES_STORAGE_KEY]) {
      currentProfiles = normalizeProfiles(changes[PROFILES_STORAGE_KEY].newValue);
    }
  });
}

function init(): void {
  void syncInitialState();
  registerStorageListener();

  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("click", handleClick, true);
}

init();
