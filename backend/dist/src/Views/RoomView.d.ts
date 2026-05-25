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
type RoomStatus = 'waiting_for_players' | 'accepting_votes' | 'announcing_question_winner' | 'announcing_category_winner' | 'announcing_game_winner' | 'game_paused' | 'game_finished';
type GameResultsData = {
    questionWinners: {
        questionId: string;
        winnerId: string;
    }[];
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
};
type AppStateData = {
    rooms: RoomData[];
};
export declare const appState: AppStateData;
interface IRoomView {
    createRoom(roomName: string, password: string): Promise<string | null>;
    getRoom(roomId: string): Promise<RoomData | null>;
    addPlayer(roomId: string, playerName: string, roomPasswordAttempt: string): Promise<string | null>;
    disconnectPlayer(roomId: string, playerId: string): Promise<boolean>;
    reconnectPlayer(roomId: string, playerId: string): Promise<boolean>;
    getConnectedPlayers(roomId: string): Promise<PlayerData[] | null>;
    removePlayer(roomId: string, playerId: string): Promise<boolean>;
    updatePlayerVoteForCurrentQuestion(roomId: string, voterId: string, nomineeId: string): Promise<boolean>;
    startGame(roomId: string): Promise<boolean>;
    pauseGame(roomId: string): Promise<boolean>;
    nextQuestion(roomId: string): Promise<boolean>;
    broadcastRoomStateToPlayers(roomId: string): Promise<boolean>;
}
declare const RoomView: IRoomView;
export default RoomView;
//# sourceMappingURL=RoomView.d.ts.map