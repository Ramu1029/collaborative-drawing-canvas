// client/src/App.tsx
import { useEffect, useState } from "react";
import { Room } from "./pages/Room";
import "./device-block.css";

function isDesktop() {
  return window.matchMedia("(pointer: fine)").matches;
}

export default function App() {
  const [desktop, setDesktop] = useState(isDesktop());

  useEffect(() => {
    const handler = () => setDesktop(isDesktop());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!desktop) {
    return (
      <div className="device-block">
        <div className="device-card">
          <h1>Desktop Required</h1>
          <p>
            This collaborative canvas works best on a desktop or laptop.
          </p>
          <p>Please open this app on a larger screen.</p>
        </div>
      </div>
    );
  }

  return <Room />;
}
