import { expect, it } from "vitest";

it("desativa o analytics do WA-JS antes da injecao", async () => {
  await import("./config");

  expect(window.WPPConfig.disableGoogleAnalytics).toBe(true);
  expect(window.WPPConfig.poweredBy).toBeNull();
});
