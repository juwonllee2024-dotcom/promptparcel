import test from "node:test";
import assert from "node:assert/strict";
import { insertIntoActiveComposer } from "../src/inject.mjs";

test("inserts a parcel into the focused textarea without submitting", () => {
  const input = {
    tagName: "TEXTAREA",
    value: "Use this context:",
    focus() {
      this.focused = true;
    },
    dispatchEvent(event) {
      this.lastEvent = event;
    }
  };
  const previousDocument = globalThis.document;
  globalThis.document = {
    activeElement: input,
    querySelector() {
      return input;
    }
  };

  try {
    const injected = eval(`(${insertIntoActiveComposer.toString()})`);
    const result = injected("--- BEGIN FILE ---\nhello\n--- END FILE ---");

    assert.deepEqual(result, { ok: true, target: "textarea", characters: 41 });
    assert.equal(input.value, "Use this context:\n\n--- BEGIN FILE ---\nhello\n--- END FILE ---");
    assert.equal(input.focused, true);
    assert.equal(input.lastEvent.type, "input");
  } finally {
    globalThis.document = previousDocument;
  }
}
);

test("returns a safe error when the current page has no editable composer", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    activeElement: null,
    querySelector() {
      return null;
    }
  };

  try {
    const result = insertIntoActiveComposer("context");
    assert.equal(result.ok, false);
    assert.match(result.reason, /editable AI composer/i);
  } finally {
    globalThis.document = previousDocument;
  }
}
);
