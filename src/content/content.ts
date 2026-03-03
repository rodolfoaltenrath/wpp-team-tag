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
import { findComposer, readComposerText, SEND_BUTTON_SELECTOR } from "./wa";

let currentProfileId = DEFAULT_PROFILE_ID;
let currentProfiles = cloneDefaultProfiles();
let isSending = false;
let requestCounter = 0;

const REQUEST_TIMEOUT_MS = 5000;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKnownPrefixPattern(profiles: readonly Profile[]): RegExp {
  return new RegExp(
    `^\\*?(?:${profiles.map((profile) => escapeRegExp(getEffectiveProfileName(profile))).join("|")}):\\*?\\s*\\n`,
  );
}

function getCurrentProfileName(): string {
  const currentProfile = currentProfiles.find((profile) => profile.id === currentProfileId);
  return getEffectiveProfileName(currentProfile ?? currentProfiles[0]);
}

function buildOutgoingMessage(message: string): string {
  if (buildKnownPrefixPattern(currentProfiles).test(message)) {
    return message;
  }

  return `*${getCurrentProfileName()}:*\n${message}`;
}

function getMessageFromComposer(): string | null {
  const composer = findComposer();

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

async function sendMessageUsingBridge(trigger: "enter" | "click"): Promise<void> {
  if (isSending) {
    return;
  }

  const currentMessage = getMessageFromComposer();

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
  const composer = findComposer();

  if (!(target instanceof Node) || !composer || !composer.contains(target)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  void sendMessageUsingBridge("enter");
}

function handleClick(event: MouseEvent): void {
  if (isSending) {
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

  event.preventDefault();
  event.stopImmediatePropagation();
  void sendMessageUsingBridge("click");
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
