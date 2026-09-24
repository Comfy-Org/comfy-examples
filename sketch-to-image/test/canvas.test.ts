import assert from "node:assert/strict";
import test from "node:test";
import { canvasPoint, cloneScene, findImageAtPoint, type Scene } from "../lib/canvas.ts";

const scene: Scene = {
  strokes: [],
  images: [
    { id: "back", src: "back", x: 10, y: 10, width: 100, height: 100 },
    { id: "front", src: "front", x: 30, y: 30, width: 100, height: 100 },
  ],
};

test("scales pointer coordinates to the drawing surface", () => {
  assert.deepEqual(canvasPoint(110, 70, { left: 10, top: 20, width: 200, height: 100 }, 800, 400), { x: 400, y: 200 });
});

test("selects the topmost image under the pointer", () => {
  assert.equal(findImageAtPoint(scene, { x: 50, y: 50 })?.id, "front");
  assert.equal(findImageAtPoint(scene, { x: 15, y: 15 })?.id, "back");
  assert.equal(findImageAtPoint(scene, { x: 500, y: 500 }), undefined);
});

test("clones scenes without sharing nested state", () => {
  const original = { ...scene, strokes: [{ points: [{ x: 1, y: 2 }], width: 4, erase: false, color: "red" }] };
  const copy = cloneScene(original);
  copy.images[0]!.x = 999;
  copy.strokes[0]!.points[0]!.x = 999;
  assert.equal(original.images[0]!.x, 10);
  assert.equal(original.strokes[0]!.points[0]!.x, 1);
});
