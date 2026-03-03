<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { DEFAULT_PROFILE_ID, profiles } from "../shared/profiles";
import { getProfile, setProfile } from "../shared/storage";

const selectedProfileId = ref(DEFAULT_PROFILE_ID);
const sampleMessage = "Olá, como posso ajudar?";

const selectedProfile = computed(() => {
  return profiles.find((profile) => profile.id === selectedProfileId.value) ?? profiles[0];
});

const previewMessage = computed(() => {
  return `*${selectedProfile.value.name}:*\n${sampleMessage}`;
});

async function handleProfileChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  selectedProfileId.value = value;
  await setProfile(value);
}

onMounted(async () => {
  selectedProfileId.value = await getProfile();
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

.field span,
.preview-label {
  font-size: 13px;
  font-weight: 600;
}

select {
  width: 100%;
  border: 1px solid #9dc2af;
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  background: #fff;
  color: inherit;
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
