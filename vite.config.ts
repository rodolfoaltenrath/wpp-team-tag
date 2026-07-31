import { crx, type CrxPlugin, type ManifestV3Export } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

function firefoxBackgroundPlugin(): CrxPlugin {
  const fileName = "firefox/background.js";
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");

  return {
    name: "firefox-classic-background",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const [outputName, output] of Object.entries(bundle)) {
        const moduleId =
          output.type === "chunk" ? output.facadeModuleId?.replace(/\\/g, "/") : null;

        if (moduleId?.endsWith("/src/content/runtime.ts")) {
          delete bundle[outputName];
        }
      }
    },
    renderCrxManifest(outputManifest, bundle) {
      delete bundle["service-worker-loader.js"];
      this.emitFile({ type: "asset", fileName, source });

      return {
        ...outputManifest,
        background: {
          scripts: [fileName],
        },
      };
    },
  };
}

// O CRXJS usa o manifest como fonte da verdade para gerar a extensao.
export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";
  const targetManifest = isFirefox
    ? {
        ...manifest,
        permissions: [...manifest.permissions, "scripting"],
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
                standaloneFiles: ["src/content/page.ts"],
              },
            }
          : {}),
      }),
      ...(isFirefox ? [firefoxBackgroundPlugin()] : []),
    ],
    build: {
      outDir: isFirefox ? "dist-firefox" : "dist",
    },
    resolve: {
      alias: isFirefox
        ? [
            {
              find: "./runtimeInjection",
              replacement: "/src/content/firefoxRuntime.ts",
            },
          ]
        : [],
    },
    define: {
      __FIREFOX__: JSON.stringify(isFirefox),
    },
  };
});
