import {
  DEFAULT_PROFILE_ID,
  type Profile,
  isKnownProfileId,
  normalizeProfiles,
} from "./profiles";

const STORAGE_KEY = "selectedProfileId";
const PROFILES_STORAGE_KEY = "teamProfiles";

// Le o perfil salvo. Se nada tiver sido salvo ainda, usa o perfil padrao.
export async function getProfile(): Promise<string> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as Record<string, string | undefined>;
  const storedProfileId = result[STORAGE_KEY];
  return storedProfileId && isKnownProfileId(storedProfileId) ? storedProfileId : DEFAULT_PROFILE_ID;
}

// Persiste o perfil selecionado para ser reutilizado pelo popup e content script.
export async function setProfile(profileId: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: isKnownProfileId(profileId) ? profileId : DEFAULT_PROFILE_ID,
  });
}

// Le os nomes configurados no navegador, sempre devolvendo os tres slots esperados.
export async function getProfiles(): Promise<Profile[]> {
  const result = (await chrome.storage.local.get(PROFILES_STORAGE_KEY)) as Record<string, unknown>;
  return normalizeProfiles(result[PROFILES_STORAGE_KEY]);
}

// Salva os nomes editados pelo usuario, normalizando entradas vazias.
export async function setProfiles(profiles: Profile[]): Promise<void> {
  await chrome.storage.local.set({
    [PROFILES_STORAGE_KEY]: normalizeProfiles(profiles),
  });
}

export { PROFILES_STORAGE_KEY, STORAGE_KEY };
