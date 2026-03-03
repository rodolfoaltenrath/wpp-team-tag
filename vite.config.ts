import { crx } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

// O CRXJS usa o manifest como fonte da verdade para gerar a extensao.
export default defineConfig({
  plugins: [vue(), crx({ manifest })],
});
