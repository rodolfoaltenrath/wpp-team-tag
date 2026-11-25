import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PAGE_BRIDGE_READY_EVENT, PAGE_BRIDGE_STATUS_EVENT } from "../shared/wppBridge";

const pageWindow = window as Window & { WPP?: unknown };
let messageListener: EventListener | undefined;

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  const original = window.addEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    if (type === "message") messageListener = listener as EventListener;
    original(type, listener, options);
  });
  vi.spyOn(window, "postMessage").mockImplementation(() => {});
});

afterEach(() => {
  if (messageListener) window.removeEventListener("message", messageListener);
  messageListener = undefined;
  delete pageWindow.WPP;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("inicializacao do bridge", () => {
  it("recupera um login que demora mais de tres tentativas", async () => {
    const loader = { isReady: false, isInjected: true };
    pageWindow.WPP = { loader };
    await import("./page");
    await vi.advanceTimersByTimeAsync(80_000);
    expect(window.postMessage).not.toHaveBeenCalled();

    loader.isReady = true;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(window.postMessage).toHaveBeenCalledWith({
      source: "wpp-team-tag", type: PAGE_BRIDGE_READY_EVENT,
    }, "*");
  });

  it("recupera uma injecao do runtime atrasada", async () => {
    await import("./page");
    await vi.advanceTimersByTimeAsync(750);
    expect(window.postMessage).not.toHaveBeenCalled();
    pageWindow.WPP = { isReady: true };
    await vi.advanceTimersByTimeAsync(5_000);
    expect(window.postMessage).toHaveBeenCalledWith({
      source: "wpp-team-tag", type: PAGE_BRIDGE_READY_EVENT,
    }, "*");
  });

  it("repete a prontidao quando o content script perdeu o primeiro aviso", async () => {
    pageWindow.WPP = { isReady: true };
    await import("./page");
    await vi.advanceTimersByTimeAsync(750);
    vi.mocked(window.postMessage).mockClear();
    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: { source: "wpp-team-tag", type: PAGE_BRIDGE_STATUS_EVENT },
    }));
    expect(window.postMessage).toHaveBeenCalledWith({
      source: "wpp-team-tag", type: PAGE_BRIDGE_READY_EVENT,
    }, "*");
  });
});
