// represents a singular vote from one player to another
type VoteData = {
  voterId: string;
  nomineeId: string;
  questionId: string;
  categoryId: string;
};

export type PlayerData = {
  name: string;
  id: string;
  connected: boolean;
  color: { bg: string; text: string };
  gameMaster: boolean;
};
type QuestionData = { id: string; text: string; icon: string };
type CategoryData = { id: string; name: string; questions: QuestionData[] };
type RoomStatus =
  | 'waiting_for_players'
  | 'accepting_votes'
  | 'announcing_question_winner'
  | 'announcing_category_winner'
  | 'announcing_game_winner'
  | 'game_finished';

type PodiumSpot = { playerId: string; playerName: string; votes: number };

type GameResultsData = {
  questionWinners: { questionId: string; winnerId: string }[];
  currentPodium: [PodiumSpot, PodiumSpot, PodiumSpot | null];
  categoryWinners: { categoryId: string; winnerId: string }[];
  gameWinnerId: string | null;
};

// only the data needed to be streamed over websockets
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
