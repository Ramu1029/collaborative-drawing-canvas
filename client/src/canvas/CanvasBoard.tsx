import { useRef, useEffect } from "react";
import { drawSegment } from "./draw";
import { socket } from "../socket/socket";

export function CanvasBoard({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // handle incoming stroke batches (from other users)
    const handleStroke = ({ strokeId, points, color, width }: any) => {
      const last = points[0];
      for (let i = 0; i < points.length; i++) {
        if (i === 0) continue;
        drawSegment(ctx, points[i - 1], points[i], color, width);
      }
    };

    // handle full room sync (undo/redo)
    const handleRoomSync = ({ strokes }: any) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach((s: any) => {
        for (let i = 1; i < s.points.length; i++) {
          drawSegment(ctx, s.points[i - 1], s.points[i], s.color, s.width);
        }
      });
    };

    // initial room state
    const handleRoomInit = ({ strokes }: any) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach((s: any) => {
        for (let i = 1; i < s.points.length; i++) {
          drawSegment(ctx, s.points[i - 1], s.points[i], s.color, s.width);
        }
      });
    };

    socket.on("stroke", handleStroke);
    socket.on("room-sync", handleRoomSync);
    socket.on("room-init", handleRoomInit);

    return () => {
      socket.off("stroke", handleStroke);
      socket.off("room-sync", handleRoomSync);
      socket.off("room-init", handleRoomInit);
    };
  }, []);

  function startDraw(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const stroke = {
      id: crypto.randomUUID(),
      userId: socket.id,
      color: "black",
      width: 4,
      points: [point],
    };

    currentStroke.current = stroke;

    socket.emit("stroke", {
      roomId,
      strokeId: stroke.id,
      userId: stroke.userId,
      points: [point],
      color: stroke.color,
      width: stroke.width,
    });
  }

  function moveDraw(e: React.PointerEvent) {
    if (!currentStroke.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // emit a small batch (single point) so server can merge
    socket.emit("stroke", {
      roomId,
      strokeId: currentStroke.current.id,
      userId: currentStroke.current.userId,
      points: [point],
      color: currentStroke.current.color,
      width: currentStroke.current.width,
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
