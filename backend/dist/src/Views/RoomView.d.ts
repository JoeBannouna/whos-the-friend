type VoteData = {
    voterId: string;
    nomineeId: string;
    questionId: string;
    categoryId: string;
};
type PlayerData = {
    name: string;
    id: string;
    connected: boolean;
};
type QuestionData = {
    id: string;
    text: string;
    icon: string;
};
type CategoryData = {
    id: string;
    name: string;
    questions: QuestionData[];
};
type RoomStatus = 'waiting_for_players' | 'accepting_votes' | 'announcing_question_winner' | 'announcing_category_winner' | 'announcing_game_winner' | 'game_finished';
type PodiumSpot = {
    playerId: string;
    playerName: string;
    votes: number;
};
type GameResultsData = {
    questionWinners: {
        questionId: string;
        winnerId: string;
    }[];
    currentPodium: [PodiumSpot, PodiumSpot, PodiumSpot];
    categoryWinners: {
        categoryId: string;
        winnerId: string;
    }[];
    gameWinnerId: string | null;
};
type RoomData = {
    name: string;
    password: string;
    id: string;
    players: PlayerData[];
    categories: CategoryData[];
    currentCategoryId: string;
    currentQuestionId: string;
    playerVotes: VoteData[];
    gameResults: GameResultsData;
    status: RoomStatus;
    gamePaused: boolean;
};
export type StreamableRoomData = {
    players: PlayerData[];
    currentCategory: CategoryData | null;
    currentQuestion: QuestionData | null;
    currentQuestionVotes: VoteData[];
    gameResults: GameResultsData;
    status: RoomStatus;
    gamePaused: boolean;
};
interface IRoomView {
    createRoom(roomName: string, password: string): Promise<string | null>;
    getRoom(roomId: string): Promise<RoomData | null>;
    addPlayer(roomId: string, playerName: string, roomPasswordAttempt: string): Promise<string | null>;
    playerExists(roomId: string, playerId: string): Promise<boolean>;
    disconnectPlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
    reconnectPlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
    getConnectedPlayers(roomId: string): Promise<PlayerData[] | null>;
    removePlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
    updatePlayerVoteForCurrentQuestion(roomId: string, voterId: string, nomineeId: string): Promise<StreamableRoomData | null>;
    startGame(roomId: string): Promise<StreamableRoomData | null>;
    pauseGame(roomId: string): Promise<StreamableRoomData | null>;
    resumeGame(roomId: string): Promise<StreamableRoomData | null>;
    next(roomId: string): Promise<StreamableRoomData | null>;
    getStreamableGameState(roomId: string): Promise<StreamableRoomData | null>;
}
declare const RoomView: IRoomView;
export default RoomView;
//# sourceMappingURL=RoomView.d.ts.map