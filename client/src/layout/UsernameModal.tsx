import { useState } from "react";
import "../styles/layout.css";

type Props = {
  onSubmit: (name: string) => void;
};

export function UsernameModal({ onSubmit }: Props) {
  const [name, setName] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit(name.trim());
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Enter your name</h2>
        <p>This name will be visible to others</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />

        <button
          disabled={!name.trim()}
          onClick={handleSubmit}
        >
          Join Canvas
        </button>
      </div>
    </div>
  );
}
