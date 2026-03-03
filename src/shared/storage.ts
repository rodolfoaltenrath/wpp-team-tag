import { DEFAULT_PROFILE_ID } from "./profiles";

const STORAGE_KEY = "selectedProfileId";

// Le o perfil salvo. Se nada tiver sido salvo ainda, usa o perfil padrao.
export async function getProfile(): Promise<string> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as Record<string, string | undefined>;
  return result[STORAGE_KEY] ?? DEFAULT_PROFILE_ID;
}

// Persiste o perfil selecionado para ser reutilizado pelo popup e content script.
export async function setProfile(profileId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: profileId });
}

export { STORAGE_KEY };
