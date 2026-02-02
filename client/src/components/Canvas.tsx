import { useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import { useTool } from "../context/ToolContext";

type Point = { x: number; y: number };

const BATCH_INTERVAL = 40;
const MAX_POINTS = 8;

export function Canvas({ username }: { username?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  const pendingPoints = useRef<Point[]>([]);
  const lastFlush = useRef<number>(Date.now());

  const userId = useRef(crypto.randomUUID());
  const currentStrokeId = useRef<string | null>(null);
  const { color } = useTool();

  // logical stroke history (NOT used for live redraw)
  const strokeMap = useRef<Map<string, Point[]>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const handleRoomSync = ({ strokes }: any) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokeMap.current.clear();

      strokes.forEach((stroke: any) => {
        strokeMap.current.set(stroke.id, stroke.points);
        drawStroke(ctx, stroke.points, stroke.color, stroke.width);
      });
    };

    socket.on("room-sync", handleRoomSync);

    function handleStroke(data: any) {
      const { strokeId, points, color, width } = data;

      const existing = strokeMap.current.get(strokeId) || [];
      // draw incremental segments: if there is an existing last point, draw
      // a segment from it to the first incoming point, then draw any
      // additional points in the batch.
      if (existing.length > 0 && points.length > 0) {
        const last = existing[existing.length - 1];
        // draw segment from last existing to first new
        drawStroke(ctx, [last, points[0]], color, width);
      }

      if (points.length > 1) {
        // draw remaining points in batch
        drawStroke(ctx, points, color, width);
      }

      strokeMap.current.set(strokeId, [...existing, ...points]);
    }

    function handleRoomInit({ strokes }: any) {
      strokes.forEach((stroke: any) => {
        strokeMap.current.set(stroke.id, stroke.points);
        drawStroke(ctx, stroke.points, stroke.color, stroke.width);
      });
    }

    socket.on("stroke", handleStroke);
    socket.on("room-init", handleRoomInit);

    return () => {
      socket.off("stroke", handleStroke);
      socket.off("room-init", handleRoomInit);
      socket.off("room-sync", handleRoomSync);
    };
  }, []);

  function drawStroke(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    width: number,
  ) {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function getPos(e: MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function flushBatch(strokeColor = color, width = 3) {
    if (pendingPoints.current.length < 2) return;

    socket.emit("stroke", {
      roomId: "abc",
      strokeId: currentStrokeId.current,
      userId: userId.current,
      points: [...pendingPoints.current],
      username: username || null,
      color: strokeColor,
      width,
    });

    pendingPoints.current = [pendingPoints.current.at(-1)!];
    lastFlush.current = Date.now();
  }

  function onMouseDown(e: React.MouseEvent) {
    drawing.current = true;
    currentStrokeId.current = crypto.randomUUID();

    const point = getPos(e.nativeEvent);
    lastPoint.current = point;
    pendingPoints.current = [point];
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drawing.current || !lastPoint.current) return;

    const ctx = canvasRef.current!.getContext("2d")!;
    const point = getPos(e.nativeEvent);

    // smooth local preview
    drawStroke(ctx, [lastPoint.current, point], color, 3);

    pendingPoints.current.push(point);

    const now = Date.now();
    if (
      now - lastFlush.current >= BATCH_INTERVAL ||
      pendingPoints.current.length >= MAX_POINTS
    ) {
      flushBatch();
    }

    lastPoint.current = point;
    socket.emit("cursor-move", {
      roomId: "abc",
      userId: userId.current,
      username: username || null,
      x: point.x,
      y: point.y,
      color: "red",
    });
  }

  function onMouseUp() {
    if (drawing.current) flushBatch();

    drawing.current = false;
    lastPoint.current = null;
    currentStrokeId.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{ border: "1px solid black" }}
    />
  );
}
