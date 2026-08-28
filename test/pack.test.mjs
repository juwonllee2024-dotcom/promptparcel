import test from "node:test";
import assert from "node:assert/strict";
import { createParcel } from "../src/pack.mjs";

function fakeFile(name, content, type = "text/plain") {
  return {
    name,
    size: new TextEncoder().encode(content).length,
    type,
    async text() {
      return content;
    }
  };
}

test("creates a portable envelope with file receipt metadata and content", async () => {
  const parcel = await createParcel([
    fakeFile("src/app.js", "export const answer = 42;"),
    fakeFile("README.md", "# Demo")
  ]);

  assert.equal(parcel.schema, "promptparcel/v1");
  assert.equal(parcel.entries.length, 2);
  assert.deepEqual(parcel.entries.map(({ name, chars }) => ({ name, chars })), [
    { name: "src/app.js", chars: 25 },
    { name: "README.md", chars: 6 }
  ]);
  assert.match(parcel.envelope, /BEGIN FILE: src\/app\.js/);
  assert.match(parcel.envelope, /SHA-256: [a-f0-9]{64}/);
  assert.match(parcel.envelope, /export const answer = 42;/);
  assert.doesNotMatch(parcel.envelope, /C:\\Users|\/Users\//);
  assert.equal(parcel.sha256.length, 64);
}
);

test("rejects binary-looking files instead of silently reading them", async () => {
  await assert.rejects(
    createParcel([fakeFile("design.pdf", "not actually a pdf", "application/pdf")]),
    /text-like file/i
  );
}
);

test("fails closed when a file exceeds the explicit byte limit", async () => {
  await assert.rejects(
    createParcel([fakeFile("large.txt", "1234567890")], { maxFileBytes: 5 }),
    /too large/i
  );
}
);

test("fails closed instead of truncating a parcel over the total limit", async () => {
  await assert.rejects(
    createParcel([fakeFile("notes.md", "1234567890")], { maxPackChars: 5 }),
    /parcel is too large/i
  );
}
);
