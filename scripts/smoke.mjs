import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createParcel } from "../src/pack.mjs";

const project = join(fileURLToPath(new URL("..", import.meta.url)));
const source = JSON.parse(await readFile(join(project, "examples", "files.json"), "utf8"));
const parcel = await createParcel(source.files.map((file) => ({ ...file, async text() { return file.content; } })));
assert.equal(parcel.entries.length, 2);
assert.match(parcel.envelope, /BEGIN FILE: app\.js/);
assert.match(parcel.envelope, /BEGIN FILE: README\.md/);
assert.equal(parcel.entries[0].sha256.length, 64);
for (const relative of ["manifest.json", "popup.html", "popup.css", "popup.js", "src/pack.mjs", "src/inject.mjs", "BUILD.txt"]) await access(join(project, "dist", relative));
console.log(`Smoke passed: ${parcel.entries.length} files packed with receipts; dist package readable.`);
