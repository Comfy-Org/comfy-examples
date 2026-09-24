export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; width: number; erase: boolean };

export function copyStrokes(strokes: Stroke[]): Stroke[] {
  return strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) }));
}

export function canvasPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  width: number,
  height: number,
): Point {
  return {
    x: Math.max(0, Math.min(width, (clientX - rect.left) * width / rect.width)),
    y: Math.max(0, Math.min(height, (clientY - rect.top) * height / rect.height)),
  };
}

export function drawPath(context: CanvasRenderingContext2D, stroke: Stroke) {
  const first = stroke.points[0];
  if (!first) return;

  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(first.x, first.y);

  if (stroke.points.length === 1) {
    context.lineTo(first.x + 0.01, first.y + 0.01);
  } else {
    for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
  }

  context.stroke();
}
