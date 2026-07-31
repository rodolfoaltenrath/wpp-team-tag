import { crx, type ManifestV3Export } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

// O CRXJS usa o manifest como fonte da verdade para gerar a extensao.
export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";
  const targetManifest = isFirefox
    ? {
        ...manifest,
        content_scripts: [
          ...manifest.content_scripts,
          {
            matches: ["https://web.whatsapp.com/*"],
            js: ["src/content/runtime.ts"],
            run_at: "document_idle" as const,
            world: "MAIN" as const,
          },
        ],
      }
    : manifest;

  return {
    plugins: [
      vue(),
      crx({
        manifest: targetManifest as ManifestV3Export,
        browser: isFirefox ? "firefox" : "chrome",
        ...(isFirefox
          ? {
              contentScripts: {
                standaloneFiles: ["src/content/page.ts", "src/content/runtime.ts"],
              },
            }
          : {}),
      }),
    ],
    build: {
      outDir: isFirefox ? "dist-firefox" : "dist",
    },
    define: {
      __FIREFOX__: JSON.stringify(isFirefox),
    },
  };
});
