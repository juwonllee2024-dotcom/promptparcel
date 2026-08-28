import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createParcel } from "../src/pack.mjs";
import { insertIntoActiveComposer } from "../src/inject.mjs";

const project = join(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(await readFile(join(project, "manifest.json"), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.action.default_popup, "popup.html");
assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "clipboardWrite"]);
assert.equal(typeof createParcel, "function");
assert.equal(typeof insertIntoActiveComposer, "function");
const parcel = await createParcel([{ name: "check.txt", type: "text/plain", size: 5, async text() { return "hello"; } }]);
assert.equal(parcel.entries[0].name, "check.txt");
assert.equal(parcel.schema, "promptparcel/v1");
console.log("Typecheck passed: MV3 manifest, core exports, and local parcel contract are valid.");
