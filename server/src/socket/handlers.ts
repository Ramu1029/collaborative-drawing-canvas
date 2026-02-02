import { Server, Socket } from "socket.io";
import crypto from "crypto";
import { RoomManager } from "../rooms/RoomManager.ts";
import { Stroke } from "../types";

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    const room = roomManager.getRoom(roomId);

    socket.emit("room-init", {
      strokes: room.strokes,
    });
  });

  socket.on("stroke", ({ roomId, userId, strokeId, points, color, width }) => {
    const room = roomManager.getRoom(roomId);

    const stroke: Stroke = {
      id: strokeId,
      userId,
      points,
      color,
      width,
      createdAt: Date.now(),
    };

    room.addStroke(stroke);

    socket.to(roomId).emit("stroke", stroke);
  });

  socket.on("undo", ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    const removed = room.undo();

    if (!removed) return;

    io.to(roomId).emit("room-sync", {
      strokes: room.strokes,
    });
  });

  socket.on("redo", ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    const restored = room.redo();

    if (!restored) return;

    io.to(roomId).emit("room-sync", {
      strokes: room.strokes,
    });
  });
}
