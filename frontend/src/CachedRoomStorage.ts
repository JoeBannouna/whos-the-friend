const CachedRoomStorage = {
  async setCachedPlayerIdForRoom(roomId: string, playerId: string): Promise<boolean> {
    localStorage.setItem(roomId, playerId);
    return true;
  },
  async getCachedPlayerIdForRoom(roomId: string): Promise<string | null> {
    const playerId = localStorage.getItem(roomId);
    return playerId;
  },
};

export default CachedRoomStorage;
