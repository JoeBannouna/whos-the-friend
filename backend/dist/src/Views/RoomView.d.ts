type VoteData = {
    voterId: string;
    nomineeId: string;
    questionId: string;
    categoryId: string;
};
declare const bgColors: readonly ["#f2a7b8", "#a8c8f0", "#a8d8a8", "#f5d08a", "#c4a8e8", "#f5b08a", "#a8e8e0", "#f0a8d8", "#b8d8a0", "#a8b8f0", "#f0c8a8", "#c8e8f0"];
declare const textColors: readonly ["#8b3a4a", "#2a4a6b", "#2a5a2a", "#7a5a10", "#4a2a7a", "#7a3a1a", "#1a5a54", "#7a2a5a", "#3a5a1a", "#2a3a7a", "#7a4a1a", "#1a4a5a"];
export declare const colors: {
    bg: (typeof bgColors)[number];
    text: (typeof textColors)[number];
}[];
type Color = (typeof colors)[number];
type PlayerData = {
    name: string;
    id: string;
    connected: boolean;
    color: Color;
    gameMaster: boolean;
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
    questionPodiums: {
        question: QuestionData;
        podium: PodiumSpot[];
    }[];
    currentPodium: PodiumSpot[];
    categoryPodiums: {
        catgeory: CategoryData;
        podium: PodiumSpot[];
    }[];
    gamePodium: PodiumSpot[];
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
    roomId: string;
    players: PlayerData[];
    currentCategory: CategoryData | null;
    currentQuestion: QuestionData | null;
    currentQuestionVotes: VoteData[];
    gameResults: GameResultsData;
    status: RoomStatus;
    gamePaused: boolean;
};
interface IRoomView {
    getAllRooms(): Promise<{
        roomName: string;
        roomId: string;
        playersNumber: number;
        roomStatus: RoomStatus;
    }[]>;
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
    isGameMaster(roomId: string, playerId: string): Promise<boolean>;
    getStreamableGameState(roomId: string): Promise<StreamableRoomData | null>;
}
declare const RoomView: IRoomView;
export default RoomView;
//# sourceMappingURL=RoomView.d.ts.map