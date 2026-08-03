import { describe, expect, it } from "vitest";
import { canInterceptSend } from "./interception";

describe("interceptacao do envio", () => {
  it("deixa o WhatsApp enviar normalmente enquanto o runtime nao esta pronto", () => {
    expect(canInterceptSend(false)).toBe(false);
  });

  it("intercepta o envio somente depois que o runtime esta pronto", () => {
    expect(canInterceptSend(true)).toBe(true);
  });
});
