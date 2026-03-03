import { profiles } from "../shared/profiles";
import { getProfile, STORAGE_KEY } from "../shared/storage";
import { findComposer, readComposerText, writeComposerText } from "./wa";

let currentProfileId = profiles[0].id;
let bypassNextSendClick = false;
let isReplaySendInProgress = false;

// Escapa o nome do perfil para uso seguro em regex.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Monta a regex para detectar se a mensagem ja comeca com qualquer perfil conhecido.
const knownPrefixPattern = new RegExp(
  `^\\*?(?:${profiles.map((profile) => escapeRegExp(profile.name)).join("|")}):\\*?\\s*\\n`,
);

// Resolve o nome do perfil atualmente selecionado.
function getCurrentProfileName(): string {
  return profiles.find((profile) => profile.id === currentProfileId)?.name ?? profiles[0].name;
}

// Gera o texto final que deve aparecer no composer antes do envio.
function buildPrefixedMessage(message: string, profileName: string): string {
  return `*${profileName}:*\n${message}`;
}

// Prefixa apenas quando houver mensagem e ainda nao existir um prefixo conhecido.
function prefixCurrentComposerMessage(): boolean {
  const composer = findComposer();

  if (!composer) {
    return false;
  }

  const currentMessage = readComposerText(composer).trim();

  if (!currentMessage || knownPrefixPattern.test(currentMessage)) {
    return false;
  }

  writeComposerText(composer, buildPrefixedMessage(currentMessage, getCurrentProfileName()));
  return true;
}

// Reaproveita o fluxo nativo do Enter apos atualizar o conteudo do composer.
function triggerSendAfterPrefix(): void {
  const composer = findComposer();

  if (!composer) {
    return;
  }

  window.setTimeout(() => {
    isReplaySendInProgress = true;
    composer.focus();

    composer.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    composer.dispatchEvent(
      new KeyboardEvent("keyup", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
      }),
    );

    window.setTimeout(() => {
      isReplaySendInProgress = false;
    }, 0);
  }, 50);
}

// Garante que o valor em memoria acompanhe alteracoes feitas pelo popup.
async function syncInitialProfile(): Promise<void> {
  currentProfileId = await getProfile();
}

// Intercepta Enter sem Shift antes do WhatsApp processar o envio.
function handleKeydown(event: KeyboardEvent): void {
  if (isReplaySendInProgress) {
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

  if (!prefixCurrentComposerMessage()) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  triggerSendAfterPrefix();
}

// Detecta cliques no botao de envio usando captura para agir antes do app.
function handleClick(event: MouseEvent): void {
  if (isReplaySendInProgress) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const sendIcon = target.closest("[data-icon='send']");
  const clickable = sendIcon?.closest("button, [role='button']") ?? target.closest("button, [role='button']");

  if (!clickable || !clickable.querySelector("[data-icon='send']")) {
    return;
  }

  if (!prefixCurrentComposerMessage()) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  triggerSendAfterPrefix();
}

function registerStorageListener(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    const updatedProfileId = changes[STORAGE_KEY].newValue as string | undefined;
    currentProfileId = updatedProfileId ?? profiles[0].id;
  });
}

function init(): void {
  void syncInitialProfile();
  registerStorageListener();

  // Capture = true para executar antes do listener interno do WhatsApp.
  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("click", handleClick, true);
}

init();
