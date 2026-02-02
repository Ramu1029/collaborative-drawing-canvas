import { FaPaintBrush, FaEraser } from "react-icons/fa";
import { MdDriveFileRenameOutline, MdOutlineRectangle } from "react-icons/md";
import "../styles/layout.css";

export function LeftToolbar() {
  return (
    <div className="left-toolbar">
      <button title="Brush">
        <FaPaintBrush />
      </button>

      <button title="Rectangle">
        <MdOutlineRectangle />
      </button>

      <button title="Line">
        <MdDriveFileRenameOutline />
      </button>

      <button title="Eraser">
        <FaEraser />
      </button>
    </div>
  );
}
