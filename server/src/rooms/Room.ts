import { Stroke } from "../types";

export class Room {
  readonly id: string;

  strokes: Stroke[] = [];
  redoStack: Stroke[] = [];

  constructor(id: string) {
    this.id = id;
  }

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke);
    
    this.redoStack = [];
  }

  undo(): Stroke | null {
    const stroke = this.strokes.pop();
    if (!stroke) return null;

    this.redoStack.push(stroke);
    return stroke;
  }

  redo(): Stroke | null {
    const stroke = this.redoStack.pop();
    if (!stroke) return null;

    this.strokes.push(stroke);
    return stroke;
  }
}
