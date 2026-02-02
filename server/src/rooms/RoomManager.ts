import { Room } from "./Room.ts";

export class RoomManager {
  private rooms = new Map<string, Room>();

  getRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId)!;
  }
}
