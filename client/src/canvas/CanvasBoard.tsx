import { useRef, useEffect } from "react";
import { drawSegment } from "./draw";
import { socket } from "../socket/socket";

export function CanvasBoard({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    socket.on("stroke-segmented", ({ strokeId, point }) => {
      const stroke = currentStroke.current;
      if (!stroke || stroke.id !== strokeId) return;

      const last = stroke.points.at(-1);
      drawSegment(ctx, last, point, stroke.color, stroke.width);
      stroke.points.push(point);
    });

    socket.on("undo-applied", ({ strokes }) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach((s: any) => {
        for (let i = 1; i < s.points.length; i++) {
          drawSegment(ctx, s.points[i - 1], s.points[i], s.color, s.width);
        }
      });
    });
  }, []);

  function startDraw(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const stroke = {
      id: crypto.randomUUID(), // 👈 native UUID
      userId: socket.id,
      color: "black",
      width: 4,
      points: [point],
    };

    currentStroke.current = stroke;
    socket.emit("stroke-start", { roomId, stroke });
  }

  function moveDraw(e: React.PointerEvent) {
    if (!currentStroke.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    socket.emit("stroke-segment", {
      roomId,
      strokeId: currentStroke.current.id,
      point,
    });
  }

  function endDraw() {
    currentStroke.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onPointerDown={startDraw}
      onPointerMove={moveDraw}
      onPointerUp={endDraw}
    />
  );
}
