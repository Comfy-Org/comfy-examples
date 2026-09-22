import assert from "node:assert/strict";
import test from "node:test";
import { getStyle, promptForStyle, styles } from "../lib/styles.ts";

test("style catalog has unique stable IDs and all prompts preserve identity", () => {
  assert.equal(new Set(styles.map((style) => style.id)).size, styles.length);
  assert.equal(styles.length, 5);
  for (const style of styles) {
    const prompt = promptForStyle(style, 0);
    assert.match(prompt, /same person/i);
    assert.match(prompt, /Variation 1/);
    assert.match(prompt, new RegExp(style.prompt.slice(0, 18), "i"));
  }
});

test("unknown styles never map to a generation preset", () => {
  assert.equal(getStyle("custom prompt"), undefined);
  assert.equal(getStyle(null), undefined);
  assert.equal(getStyle("professional")?.name, "Moon Mayor");
});
