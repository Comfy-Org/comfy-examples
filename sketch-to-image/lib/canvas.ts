export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; width: number; erase: boolean; color: string };
export type CanvasImage = { id: string; src: string; x: number; y: number; width: number; height: number };
export type Scene = { strokes: Stroke[]; images: CanvasImage[] };

export function cloneScene(scene: Scene): Scene {
  return structuredClone(scene);
}

export function canvasPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  width: number,
  height: number,
): Point {
  return {
    x: (clientX - rect.left) * (width / rect.width),
    y: (clientY - rect.top) * (height / rect.height),
  };
}

export function findImageAtPoint(scene: Scene, point: Point): CanvasImage | undefined {
  return [...scene.images].reverse().find((image) => (
    point.x >= image.x && point.x <= image.x + image.width
    && point.y >= image.y && point.y <= image.y + image.height
  ));
}

export function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;

  context.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.beginPath();
  context.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
  for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
  context.stroke();
}
