install and run the project

Clone the repository.

Open two terminals: one for the server and one for the client.

Server

cd server
npm install
npm start


Client

cd client
npm install
npm start


The backend runs on http://localhost:3000

The frontend runs on http://localhost:5173

Make sure both are running at the same time.

How to test the app with multiple users

Open the app in one browser tab.

Open another tab or a different browser (Chrome, Edge, Firefox).

Join the same room.

Draw simultaneously and observe:

Real-time strokes

Live cursors

Global undo / redo affecting all users

This setup simulates multiple users without any additional configuration.

ARCHITECTURE.md
Overview

The application is a real-time collaborative drawing system built using a client-server model.
The server is authoritative for shared state, while the client focuses on rendering and user interaction.

WebSocket Protocol

The app uses Socket.io over WebSockets for real-time communication.

Events sent from client

join-room

{ roomId: string }


stroke

{
  roomId: string
  strokeId: string
  userId: string
  points: { x: number; y: number }[]
  color: string
  width: number
}


cursor-move

{
  roomId: string
  userId: string
  username: string
  x: number
  y: number
  color: string
}


undo

{ roomId: string }


redo

{ roomId: string }

Events sent from server

room-init
Sent to a user when they join a room.

{
  strokes: Stroke[]
}


stroke
Broadcast incremental stroke updates to other users.

{
  strokeId: string
  userId: string
  points: Point[]
  color: string
  width: number
}


room-sync
Sent after undo or redo to resynchronize all clients.

{
  strokes: Stroke[]
}


cursor-move
Broadcast live cursor positions.

{
  userId: string
  username: string
  x: number
  y: number
  color: string
}

Undo / Redo Strategy

Undo and redo are implemented globally, not per user.

Each room maintains:

A list of committed strokes

An undo stack

A redo stack

When any user triggers undo:

The most recent stroke is removed from the shared stroke list

The server broadcasts the updated state using room-sync

Redo restores the last undone stroke in the same way.

This ensures all users always see the same canvas state.

Performance Decisions

Several optimizations were made to ensure smooth drawing:

Stroke batching
Mouse movements are grouped and sent at short intervals instead of per pixel.

Incremental rendering
Clients draw only new stroke segments instead of redrawing the entire canvas.

Server as state authority
Prevents divergence between clients during high activity.

No external drawing libraries
Direct Canvas API usage avoids unnecessary overhead.

These decisions keep latency low even with multiple active users.

Conflict Handling

Conflicts are handled by design rather than correction.

All strokes are treated as immutable once committed.

Simultaneous drawing is allowed without locking.

Overlapping strokes are rendered in the order received by the server.

Undo and redo operate on the shared stroke history, ensuring consistency.
