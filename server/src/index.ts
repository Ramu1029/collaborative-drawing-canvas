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
  socket.on(
    "stroke",
    ({ roomId, strokeId, points, color, width, userId, username }) => {
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

      // include username for consumers; prefer provided username or socket-stored username
      const senderName = username || (socket.data as any).username || null;

      socket.to(roomId).emit("stroke", {
        strokeId,
        userId,
        username: senderName,
        points,
        color,
        width,
      });
    },
  );

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    // store username on socket for later events
    (socket.data as any).username = username;

    const room = roomManager.getRoom(roomId);

    // build list of existing users in room
    const users: Array<{ userId: string; username: string | null }> = [];
    const s = io.sockets.adapter.rooms.get(roomId);
    if (s) {
      for (const id of s) {
        const sock = io.sockets.sockets.get(id);
        users.push({
          userId: id,
          username: (sock?.data as any)?.username || null,
        });
      }
    }

    // Send existing strokes and users to new user
    socket.emit("room-init", { strokes: room.strokes, users });

    // notify other room members that a user joined
    socket.to(roomId).emit("user-joined", { userId: socket.id, username });

    console.log(`${socket.id} joined room ${roomId} as ${username}`);
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

  socket.on("cursor-move", ({ roomId, userId, x, y, color, username }) => {
    const senderName = username || (socket.data as any).username || null;
    socket.to(roomId).emit("cursor-move", {
      userId,
      username: senderName,
      x,
      y,
      color,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // inform rooms this socket was part of
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      io.to(roomId).emit("user-left", { userId: socket.id });
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
