import { socket } from "../socket/socket";

export function TopBar() {
  const roomId = "abc";

  return (
    <div className="top-bar">
      <span className="title">Untitled Sketch</span>

      <div className="actions">
        <button onClick={() => socket.emit("undo", { roomId })}>
          Undo
        </button>

        <button onClick={() => socket.emit("redo", { roomId })}>
          Redo
        </button>

      </div>
    </div>
  );
}
