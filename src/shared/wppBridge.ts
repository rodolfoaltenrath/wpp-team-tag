export const PAGE_BRIDGE_REQUEST_EVENT = "wpp-team-tag:send-request";
export const PAGE_BRIDGE_RESPONSE_EVENT = "wpp-team-tag:send-response";

export type PageBridgeRequestDetail = {
  requestId: string;
  message: string;
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
