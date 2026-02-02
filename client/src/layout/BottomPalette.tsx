import { useTool } from "../context/ToolContext";

const COLORS = ["#ff4d4d", "#4dff88", "#4d88ff", "#ffd84d", "#ffffff"];

export function BottomPalette() {
  const { color, setColor } = useTool();

  return (
    <div className="bottom-palette">
      {COLORS.map((c) => (
        <span
          key={c}
          className="color"
          style={{
            backgroundColor: c,
            outline: c === color ? "2px solid white" : "none",
          }}
          onClick={() => setColor(c)}
        />
      ))}
    </div>
  );
}
