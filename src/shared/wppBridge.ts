export const PAGE_BRIDGE_REQUEST_EVENT = "wpp-team-tag:send-request";
export const PAGE_BRIDGE_RESPONSE_EVENT = "wpp-team-tag:send-response";
export const PAGE_BRIDGE_READY_EVENT = "wpp-team-tag:runtime-ready";
export const RUNTIME_INJECTION_MESSAGE = "wpp-team-tag:inject-runtime";

export type RuntimeInjectionRequest = {
  type: typeof RUNTIME_INJECTION_MESSAGE;
  runtimeScript: string;
};

export type RuntimeInjectionResponse = {
  ok: boolean;
  error?: string;
};

export type PageBridgeRequestDetail = {
  requestId: string;
  message: string;
  useActiveQuote: boolean;
};

export type PageBridgeResponseDetail = {
  requestId: string;
  ok: boolean;
  error?: string;
};

export type PageBridgeRequestMessage = {
  source: "wpp-team-tag";
  type: typeof PAGE_BRIDGE_REQUEST_EVENT;
  payload: PageBridgeRequestDetail;
};

export type PageBridgeResponseMessage = {
  source: "wpp-team-tag";
  type: typeof PAGE_BRIDGE_RESPONSE_EVENT;
  payload: PageBridgeResponseDetail;
};

export type PageBridgeReadyMessage = {
  source: "wpp-team-tag";
  type: typeof PAGE_BRIDGE_READY_EVENT;
};
