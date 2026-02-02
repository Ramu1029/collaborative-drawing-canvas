import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { Canvas } from "../components/Canvas";

import { TopBar } from "../layout/TopBar";
import { LeftToolbar } from "../layout/LeftToolbar";
import { RightPanel } from "../layout/RightPanel";
import { BottomPalette } from "../layout/BottomPalette";
import { UsernameModal } from "../layout/UsernameModal";
import { ToolProvider } from "../context/ToolContext";
import "../styles/layout.css";

type Cursor = {
  userId: string;
  x: number;
  y: number;
  color: string;
  username?: string | null;
};

(window as any).socket = socket;

export function Room() {
  const roomId = "abc";
  const [username, setUsername] = useState<string | null>(null);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [users, setUsers] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!username) return; // only connect after username is set

    socket.connect();
    socket.emit("join-room", { roomId, username });

    socket.on("cursor-move", (cursor: Cursor) => {
      setCursors((prev) => ({
        ...prev,
        [cursor.userId]: cursor,
      }));
    });

    socket.on("room-init", ({ users: initialUsers }: any) => {
      if (initialUsers && Array.isArray(initialUsers)) {
        const map: Record<string, string | null> = {};
        initialUsers.forEach((u: any) => (map[u.userId] = u.username));
        setUsers(map);
      }
    });

    socket.on("user-joined", ({ userId, username }) => {
      setUsers((prev) => ({ ...prev, [userId]: username }));
    });

    socket.on("user-left", ({ userId }) => {
      setUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    socket.on("cursor-leave", ({ userId }) => {
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    return () => {
      socket.off("cursor-move");
      socket.off("cursor-leave");
      socket.off("room-init");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [username]);

  // Show username modal if username is not set
  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <ToolProvider>
      <div className="room-root">
        <TopBar />

        <div className="room-body">
          <LeftToolbar />

          <div className="canvas-wrapper">
            <Canvas username={username ?? undefined} />

            <div className="cursor-layer">
              {Object.values(cursors).map((c) => (
                <div
                  key={c.userId}
                  style={{
                    position: "absolute",
                    left: c.x,
                    top: c.y,
                    width: 8,
                    height: 8,
                    backgroundColor: c.color,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
          </div>

          <RightPanel users={users} localUsername={username} />
        </div>

        <BottomPalette />
      </div>
    </ToolProvider>
  );
}
