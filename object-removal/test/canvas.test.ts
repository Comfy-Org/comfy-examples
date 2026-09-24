import assert from "node:assert/strict";
import test from "node:test";
import { canvasPoint, copyStrokes } from "../lib/canvas.ts";

test("maps pointer coordinates into the source image and clamps the edges", () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 };
  assert.deepEqual(canvasPoint(110, 70, rect, 800, 400), { x: 400, y: 200 });
  assert.deepEqual(canvasPoint(-100, 999, rect, 800, 400), { x: 0, y: 400 });
});

test("copies strokes without sharing point arrays", () => {
  const original = [{ points: [{ x: 1, y: 2 }], width: 8, erase: false }];
  const copy = copyStrokes(original);

  copy[0]!.points[0]!.x = 99;
  assert.equal(original[0]!.points[0]!.x, 1);
  assert.notEqual(copy[0], original[0]);
});
