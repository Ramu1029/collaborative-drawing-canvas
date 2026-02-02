import { createContext, useContext, useState } from "react";

type ToolContextType = {
  color: string;
  setColor: (c: string) => void;
};

const ToolContext = createContext<ToolContextType | null>(null);

export function ToolProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState("#ff4d4d");

  return (
    <ToolContext.Provider value={{ color, setColor }}>
      {children}
    </ToolContext.Provider>
  );
}

export function useTool() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTool must be inside ToolProvider");
  return ctx;
}
