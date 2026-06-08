type VoteData = {
    voterId: string;
    nomineeId: string;
    questionId: string;
    categoryId: string;
};
declare const bgColors: readonly ["#2caeb7", "#23b253", "#aac92c", "#c6a52b", "#ce6d2d", "#d62f2f", "#316be0", "#8b31d6", "#c932ba"];
declare const textColors: readonly ["#0f3e42", "#0c351a", "#363f0f", "#4f4112", "#442510", "#420f0f", "#14284f", "#311449", "#3d1038"];
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