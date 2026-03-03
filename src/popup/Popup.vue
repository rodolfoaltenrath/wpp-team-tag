<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  DEFAULT_PROFILE_ID,
  cloneDefaultProfiles,
  getDefaultProfileName,
  type Profile,
} from "../shared/profiles";
import { getProfile, getProfiles, setProfile, setProfiles } from "../shared/storage";

const selectedProfileId = ref(DEFAULT_PROFILE_ID);
const editableProfiles = ref<Profile[]>(cloneDefaultProfiles());
const sampleMessage = "Ola, como posso ajudar?";
let persistProfilesTimeoutId: number | null = null;

function getDisplayName(profile: Profile): string {
  const name = profile.name.trim();
  return name || getDefaultProfileName(profile.id);
}

const profiles = computed(() => {
  return editableProfiles.value.map((profile) => ({
    ...profile,
    name: getDisplayName(profile),
  }));
});

const selectedProfile = computed(() => {
  return profiles.value.find((profile) => profile.id === selectedProfileId.value) ?? profiles.value[0];
});

const previewMessage = computed(() => {
  return `*${selectedProfile.value.name}:*\n${sampleMessage}`;
});

function clearPersistProfilesTimeout(): void {
  if (persistProfilesTimeoutId !== null) {
    window.clearTimeout(persistProfilesTimeoutId);
    persistProfilesTimeoutId = null;
  }
}

async function persistProfiles(): Promise<void> {
  clearPersistProfilesTimeout();
  await setProfiles(editableProfiles.value);
}

function scheduleProfilesPersist(): void {
  clearPersistProfilesTimeout();
  persistProfilesTimeoutId = window.setTimeout(() => {
    void persistProfiles();
  }, 200);
}

async function handleProfileChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  selectedProfileId.value = value;
  await setProfile(value);
}

function handleProfileNameInput(profileId: string, event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  editableProfiles.value = editableProfiles.value.map((profile) => {
    return profile.id === profileId ? { ...profile, name: value } : profile;
  });

  scheduleProfilesPersist();
}

onMounted(async () => {
  const [storedProfileId, storedProfiles] = await Promise.all([getProfile(), getProfiles()]);
  selectedProfileId.value = storedProfileId;
  editableProfiles.value = storedProfiles;
});

onBeforeUnmount(() => {
  if (persistProfilesTimeoutId !== null) {
    void setProfiles(editableProfiles.value);
  }

  clearPersistProfilesTimeout();
});
</script>

<template>
  <main class="popup">
    <section class="panel">
      <p class="eyebrow">WhatsApp Web</p>
      <h1>Perfil de envio</h1>
      <p class="description">
        Escolha qual nome deve ser inserido automaticamente antes das mensagens.
      </p>

      <label class="field">
        <span>Perfil</span>
        <select :value="selectedProfileId" @change="handleProfileChange">
          <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
            {{ profile.name }}
          </option>
        </select>
      </label>

      <section class="profiles-editor">
        <div v-for="(profile, index) in editableProfiles" :key="profile.id" class="field">
          <span>Usuário {{ index + 1 }}</span>
          <input
            :value="profile.name"
            type="text"
            maxlength="24"
            :placeholder="getDefaultProfileName(profile.id)"
            @input="handleProfileNameInput(profile.id, $event)"
            @blur="persistProfiles"
          />
        </div>

        <p class="hint">Os 3 nomes ficam salvos automaticamente neste navegador.</p>
      </section>

      <section class="preview">
        <p class="preview-label">Preview</p>
        <pre>{{ previewMessage }}</pre>
      </section>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background:
    radial-gradient(circle at top, #dff7ea 0%, #f6fbf8 45%, #eef4f0 100%);
  color: #173226;
}

:global(*) {
  box-sizing: border-box;
}

.popup {
  width: 320px;
  min-height: 100vh;
  padding: 16px;
}

.panel {
  border: 1px solid #bfd8ca;
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 40px rgba(23, 50, 38, 0.12);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f7b58;
}

h1 {
  margin: 0;
  font-size: 22px;
}

.description {
  margin: 10px 0 18px;
  line-height: 1.45;
  color: #476556;
}

.field {
  display: grid;
  gap: 8px;
}

.profiles-editor {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.field span,
.preview-label {
  font-size: 13px;
  font-weight: 600;
}

select,
input {
  width: 100%;
  border: 1px solid #9dc2af;
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  background: #fff;
  color: inherit;
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #5d7869;
}

.preview {
  margin-top: 18px;
  padding: 14px;
  border-radius: 14px;
  background: #163b2b;
  color: #ecfff4;
}

pre {
  margin: 8px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
