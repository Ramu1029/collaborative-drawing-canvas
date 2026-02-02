import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { RoomManager } from "./rooms/RoomManager.js";
import crypto from "crypto";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const roomManager = new RoomManager();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("stroke", ({ roomId, strokeId, points, color, width, userId }) => {
    const room = roomManager.getRoom(roomId);

    // FIND existing stroke
    let stroke = room.strokes.find((s) => s.id === strokeId);

    if (!stroke) {
      // first batch of this stroke
      stroke = {
        id: strokeId,
        userId,
        color,
        width,
        points: [],
        createdAt: Date.now(),
      };
      room.strokes.push(stroke);
    }

    // merge batches into ONE stroke
    stroke.points.push(...points);

    socket.to(roomId).emit("stroke", {
      strokeId,
      userId,
      points,
      color,
      width,
    });
  });

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);

    const room = roomManager.getRoom(roomId);

    // Send existing strokes to new user
    socket.emit("room-init", { strokes: room.strokes });

    console.log(`${socket.id} joined room ${roomId}`);
    console.log("sending strokes:", room.strokes.length);
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

  socket.on("cursor-move", ({ roomId, userId, x, y, color }) => {
    socket.to(roomId).emit("cursor-move", {
      userId,
      x,
      y,
      color,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.broadcast.emit("cursor-leave", { userId: socket.id });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
