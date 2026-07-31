/// <reference types="vite/client" />
/// <reference types="@crxjs/vite-plugin/client" />

declare const __FIREFOX__: boolean;

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
