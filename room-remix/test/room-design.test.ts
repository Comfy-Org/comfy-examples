import assert from "node:assert/strict";
import test from "node:test";
import { buildRoomPrompt, isStyleName, parseFurniture } from "../lib/room-design.ts";

test("accepts the four room themes shown in the picker", () => {
  assert.equal(isStyleName("Moss arcade"), true);
  assert.equal(isStyleName("Space motel"), true);
  assert.equal(isStyleName("Disco fruit"), true);
  assert.equal(isStyleName("Night greenhouse"), true);
  assert.equal(isStyleName("Victorian spaceship"), false);
});

test("validates supported furniture and normalized canvas positions", () => {
  assert.deepEqual(parseFurniture([{ kind: "sofa", x: 50, y: 75 }]), [{ kind: "sofa", x: 50, y: 75 }]);
  assert.deepEqual(parseFurniture([
    { kind: "mushroom-stool", x: 50, y: 60 },
    { kind: "disco-ball", x: 40, y: 30 },
    { kind: "snail-planter", x: 80, y: 75 },
  ]), [
    { kind: "mushroom-stool", x: 50, y: 60 },
    { kind: "disco-ball", x: 40, y: 30 },
    { kind: "snail-planter", x: 80, y: 75 },
  ]);
  assert.deepEqual(parseFurniture([]), []);
  assert.equal(parseFurniture([{ kind: "wardrobe", x: 50, y: 50 }]), null);
  assert.equal(parseFurniture([{ kind: "plant", x: 101, y: 50 }]), null);
  assert.equal(parseFurniture([{ kind: "plant", x: 50, y: Number.NaN }]), null);
  assert.equal(parseFurniture(Array.from({ length: 19 }, () => ({ kind: "plant", x: 50, y: 50 }))), null);
});

test("turns selected pieces and canvas placement into a room-edit prompt", () => {
  const prompt = buildRoomPrompt("Moss arcade", [
    { kind: "mushroom-stool", x: 50, y: 75 },
    { kind: "disco-ball", x: 40, y: 45 },
    { kind: "snail-planter", x: 80, y: 20 },
  ]);

  assert.match(prompt, /mossy forest thrift store meets underground noise show/);
  assert.match(prompt, /mushroom-shaped stool with a short cream stem placed on the center, in the foreground/);
  assert.match(prompt, /mirrored disco ball lamp casting tiny reflected light flecks placed on the center, mid-room/);
  assert.match(prompt, /snail-shaped ceramic planter with a leafy sprout placed on the right side, toward the back/);
  assert.match(prompt, /Preserve the room's architecture/);
});
