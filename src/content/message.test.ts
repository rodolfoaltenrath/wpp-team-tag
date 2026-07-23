import { describe, expect, it } from "vitest";
import type { Profile } from "../shared/profiles";
import { buildOutgoingMessage } from "./message";

const profiles: Profile[] = [
  { id: "one", name: "Rodolfo" },
  { id: "two", name: "Ana (Suporte)" },
  { id: "three", name: "Carla" },
];

describe("buildOutgoingMessage", () => {
  it("adiciona o perfil antes da mensagem", () => {
    expect(buildOutgoingMessage("Ola!", "Rodolfo", profiles)).toBe(
      "_*Rodolfo:*_\nOla!",
    );
  });

  it("nao duplica um prefixo ja conhecido", () => {
    const message = "_*Ana (Suporte):*_\nComo posso ajudar?";

    expect(buildOutgoingMessage(message, "Rodolfo", profiles)).toBe(message);
  });

  it("reconhece os formatos usados pelas versoes anteriores", () => {
    expect(buildOutgoingMessage("*Carla:*\nOla!", "Rodolfo", profiles)).toBe(
      "*Carla:*\nOla!",
    );
    expect(buildOutgoingMessage("Rodolfo:\nOla!", "Rodolfo", profiles)).toBe(
      "Rodolfo:\nOla!",
    );
  });

  it("gera somente a identificacao para anexo sem legenda", () => {
    expect(buildOutgoingMessage("", "Rodolfo", profiles, true)).toBe(
      "_*Rodolfo:*_",
    );
  });
});
