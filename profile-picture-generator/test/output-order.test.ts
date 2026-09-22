import assert from "node:assert/strict";
import test from "node:test";
import { orderBundleOutputs } from "../lib/output-order.ts";

test("bundle outputs follow foreach item IDs instead of Comfy graph order", () => {
  const outputs = ["07", "08", "01", "02", "03", "04", "05", "06"].map((item) => ({
    name: `outputs/profile-picture/${item}_00001_.png`,
  }));

  assert.deepEqual(orderBundleOutputs(outputs).map(({ name }) => name.match(/\/(\d{2})_/)?.[1]), [
    "01", "02", "03", "04", "05", "06", "07", "08",
  ]);
});
