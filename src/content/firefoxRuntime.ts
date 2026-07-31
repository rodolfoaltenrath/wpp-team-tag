import runtimeScript from "./runtime?script&iife";
import {
  RUNTIME_INJECTION_MESSAGE,
  type RuntimeInjectionRequest,
  type RuntimeInjectionResponse,
} from "../shared/wppBridge";

export async function injectRuntime(): Promise<void> {
  const request: RuntimeInjectionRequest = {
    type: RUNTIME_INJECTION_MESSAGE,
    runtimeScript,
  };
  const response = (await chrome.runtime.sendMessage(request)) as
    | RuntimeInjectionResponse
    | undefined;

  if (!response?.ok) {
    throw new Error(response?.error ?? "Nao foi possivel carregar o WA-JS no Firefox.");
  }
}
