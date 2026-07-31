import { crx, type ManifestV3Export } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

// O CRXJS usa o manifest como fonte da verdade para gerar a extensao.
export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";

  return {
    plugins: [
      vue(),
      crx({
        manifest: manifest as ManifestV3Export,
        browser: isFirefox ? "firefox" : "chrome",
      }),
    ],
    build: {
      outDir: isFirefox ? "dist-firefox" : "dist",
    },
  };
});
