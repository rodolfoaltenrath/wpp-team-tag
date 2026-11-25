import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = process.argv[2] ?? "dist";
const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
assert(manifest.permissions.includes("scripting"), "Permissao scripting ausente");
assert(manifest.background, "Background de injecao ausente");
for (const script of manifest.content_scripts.filter(({ world }) => world === "MAIN")) {
  for (const file of script.js) {
    const source = readFileSync(join(directory, file), "utf8");
    assert(!/\bimport\s*\(/.test(source), `Import dinamico no contexto MAIN: ${file}`);
  }
}
const runtime = join(directory, "src/content/runtime.js");
assert(existsSync(runtime), "Runtime WA-JS autocontido ausente");
assert(!/\bimport\s*\(/.test(readFileSync(runtime, "utf8")), "Import dinamico no runtime");
console.log(`Build validado: ${directory} sem imports dinamicos no contexto MAIN.`);
