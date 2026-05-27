import fs from 'node:fs/promises';
const appState = { rooms: [] };
function makeRoomIdFromName(roomName) {
    return roomName.replaceAll(' ', '-').toLowerCase();
}
function randomPlayerId() {
    return Math.ceil(Math.random() * 10000000).toString();
}
async function populateRoomContent(roomId) {
    try {
        const response = await fs.readFile('../../public/assets/questions.json', {
            encoding: 'utf8',
        });
        const data = JSON.parse(response);
        const targetRoom = appState.rooms.find(r => r.id == roomId) || null;
        if (!targetRoom)
            return false;
        data.categories.forEach(category => {
            const newCategory = {
                name: category.name,
                id: category.id,
                questions: [],
            };
            data.questions
                .filter(q => q.cat == newCategory.id)
                .forEach(q => newCategory.questions.push({ id: q.text, text: q.text, icon: q.icon }));
            targetRoom.categories.push(newCategory);
        });
        return true;
    }
    catch (err) {
        return false;
    }
}
async function constructBroadcastMessage(targetRoom) {
    const currCategory = targetRoom.categories.find(c => c.id == targetRoom.currentCategoryId) || null;
    const currQuestion = currCategory === null
        ? null
        : currCategory.questions.find(q => q.id == targetRoom.currentQuestionId) || null;
    const currQuestionVotes = targetRoom.playerVotes.filter(vote => vote.questionId == targetRoom.currentQuestionId) || [];
    const broadcastMessage = {
        status: targetRoom.status,
        players: targetRoom.players,
        currentCategory: currCategory,
        currentQuestion: currQuestion,
        currentQuestionVotes: currQuestionVotes,
        gameResults: targetRoom.gameResults,
        gamePaused: targetRoom.gamePaused,
    };
    return broadcastMessage;
}
const RoomView = {
    createRoom: async function (roomName, password) {
        const roomId = makeRoomIdFromName(roomName);
        const newRoom = {
            name: roomName,
            password: password,
            id: roomId,
            players: [],
            categories: [],
            currentCategoryId: '',
            currentQuestionId: '',
            playerVotes: [],
            gameResults: {
                questionWinners: [],
                categoryWinners: [],
                gameWinnerId: null,
                currentPodium: [
                    { playerId: '', playerName: '', votes: 0 },
                    { playerId: '', playerName: '', votes: 0 },
                    { playerId: '', playerName: '', votes: 0 },
                ],
            },
            status: 'waiting_for_players',
            gamePaused: false,
        };
        appState.rooms.push(newRoom);
        await populateRoomContent(roomId);
        return roomId;
    },
    getRoom: async function (roomId) {
        return appState.rooms.find(room => room.id == roomId) || null;
    },
    addPlayer: async function (roomId, playerName, roomPasswordAttempt) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.status != 'waiting_for_players')
            return null;
        if (targetRoom.password != roomPasswordAttempt)
            return null;
        const playerId = randomPlayerId();
        const newPlayer = {
            name: playerName,
            id: playerId,
            connected: true,
        };
        targetRoom.players.push(newPlayer);
        return playerId;
    },
    playerExists: async function (roomId, playerId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return false;
        return targetRoom.players.find(p => p.id === playerId) !== undefined;
    },
    removePlayer: async function (roomId, playerId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.status != 'waiting_for_players')
            return null;
        const targetPlayerIndex = targetRoom.players.findIndex(p => p.id == playerId);
        if (targetPlayerIndex === -1)
            return null;
        targetRoom.players.splice(targetPlayerIndex, 1);
        return constructBroadcastMessage(targetRoom);
    },
    disconnectPlayer: async function (roomId, playerId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
        if (!targetPlayer)
            return null;
        targetPlayer.connected = false;
        return constructBroadcastMessage(targetRoom);
    },
    reconnectPlayer: async function (roomId, playerId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
        if (!targetPlayer)
            return null;
        targetPlayer.connected = true;
        return constructBroadcastMessage(targetRoom);
    },
    getConnectedPlayers: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        return targetRoom.players.filter(p => p.connected);
    },
    startGame: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.status !== 'waiting_for_players')
            return null;
        await RoomView.next(roomId);
        return constructBroadcastMessage(targetRoom);
    },
    pauseGame: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.gamePaused)
            return null;
        targetRoom.gamePaused = true;
        return constructBroadcastMessage(targetRoom);
    },
    resumeGame: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (!targetRoom.gamePaused)
            return null;
        targetRoom.gamePaused = false;
        return constructBroadcastMessage(targetRoom);
    },
    next: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        const allConnectedPlayersHaveVoted = !targetRoom.players
            .filter(p => p.connected)
            .map(p => targetRoom.playerVotes.find(vote => vote.voterId == p.id && vote.questionId == targetRoom.currentQuestionId)?.voterId || null)
            .includes(null);
        const updateQuestionWinners = () => {
            const podium = targetRoom.players
                .map(p => ({
                playerId: p.id,
                playerName: p.name,
                votes: targetRoom.playerVotes.filter(vote => {
                    return vote.questionId == targetRoom.currentQuestionId && vote.nomineeId == p.id;
                }).length,
            }))
                .sort((p1, p2) => p2.votes - p1.votes);
            const winnerId = podium[0].playerId;
            targetRoom.gameResults.questionWinners.push({
                winnerId: winnerId,
                questionId: targetRoom.currentQuestionId,
            });
            targetRoom.gameResults.currentPodium = [podium[0], podium[1], podium[2]];
        };
        const updateCategoryWinners = () => {
            const podium = targetRoom.players
                .map(p => ({
                playerId: p.id,
                playerName: p.name,
                votes: targetRoom.playerVotes.filter(vote => {
                    return vote.categoryId == targetRoom.currentCategoryId && vote.nomineeId == p.id;
                }).length,
            }))
                .sort((p1, p2) => p2.votes - p1.votes);
            const winnerId = podium[0].playerId;
            targetRoom.gameResults.categoryWinners.push({
                winnerId: winnerId,
                categoryId: targetRoom.currentCategoryId,
            });
            targetRoom.gameResults.currentPodium = [podium[0], podium[1], podium[2]];
        };
        const updateGameWinner = () => {
            targetRoom.gameResults.gameWinnerId = targetRoom.players
                .map(p => ({
                playerId: p.id,
                votes: targetRoom.playerVotes.filter(vote => vote.nomineeId == p.id).length,
            }))
                .sort((p1, p2) => p2.votes - p1.votes)[0].playerId;
        };
        let nextQuestionInCurrCategoryExists;
        let nextCategoryExists;
        const currCategoryIndex = targetRoom.categories.findIndex(c => c.id == targetRoom.currentCategoryId);
        const currCategory = currCategoryIndex != -1 ? targetRoom.categories[currCategoryIndex] : null;
        const currQuestionIndex = currCategory
            ? currCategory.questions.findIndex(q => q.id == targetRoom.currentQuestionId)
            : -1;
        if (currQuestionIndex === -1) {
            nextCategoryExists = false;
        }
        else {
            if (currCategory !== null && currCategoryIndex !== -1)
                nextCategoryExists = currCategoryIndex + 1 < targetRoom.categories.length;
            else
                nextCategoryExists = false;
        }
        if (currCategoryIndex === -1) {
            nextQuestionInCurrCategoryExists = false;
        }
        else {
            if (currCategory && currQuestionIndex !== -1)
                nextQuestionInCurrCategoryExists = currQuestionIndex + 1 < currCategory.questions.length;
            else
                nextQuestionInCurrCategoryExists = false;
        }
        const advanceToNextQuestion = () => {
            targetRoom.currentQuestionId =
                targetRoom.categories[currCategoryIndex].questions[currQuestionIndex + 1].id;
        };
        const advanceToNextCategory = () => {
            targetRoom.currentCategoryId = targetRoom.categories[currCategoryIndex + 1].id;
            targetRoom.currentQuestionId =
                targetRoom.categories[currCategoryIndex + 1].questions[0].id;
        };
        const advanceToFirstQuestion = () => {
            targetRoom.currentCategoryId = targetRoom.categories[0].id;
            targetRoom.currentQuestionId = targetRoom.categories[0].questions[0].id;
        };
        const finishGame = () => {
            // save to a database or something?
        };
        switch (targetRoom.status) {
            case 'accepting_votes':
                if (allConnectedPlayersHaveVoted) {
                    updateQuestionWinners();
                    targetRoom.status = 'announcing_question_winner';
                }
                else
                    return null;
                break;
            case 'announcing_question_winner':
                if (nextQuestionInCurrCategoryExists) {
                    advanceToNextQuestion();
                    targetRoom.status = 'accepting_votes';
                }
                else {
                    updateCategoryWinners();
                    targetRoom.status = 'announcing_category_winner';
                }
                break;
            case 'announcing_category_winner':
                if (nextCategoryExists) {
                    advanceToNextCategory();
                    targetRoom.status = 'accepting_votes';
                }
                else {
                    updateGameWinner();
                    targetRoom.status = 'announcing_game_winner';
                }
                break;
            case 'waiting_for_players':
                advanceToFirstQuestion();
                targetRoom.status = 'accepting_votes';
                break;
            case 'announcing_game_winner':
                finishGame();
                targetRoom.status = 'game_finished';
                break;
            case 'game_finished':
                // nothing to do?
                break;
            default:
                break;
        }
        return constructBroadcastMessage(targetRoom);
    },
    updatePlayerVoteForCurrentQuestion: async function (roomId, voterId, nomineeId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.status !== 'accepting_votes')
            return null;
        if (voterId == nomineeId)
            return null; // cant vote for self
        const newVote = {
            categoryId: targetRoom.currentCategoryId,
            questionId: targetRoom.currentQuestionId,
            voterId: voterId,
            nomineeId: nomineeId,
        };
        const existingVoteIndex = targetRoom.playerVotes.findIndex(vote => vote.categoryId == targetRoom.currentCategoryId &&
            vote.questionId == targetRoom.currentQuestionId &&
            vote.voterId == voterId);
        if (existingVoteIndex !== -1) {
            targetRoom.playerVotes[existingVoteIndex] = newVote;
        }
        else {
            targetRoom.playerVotes.push(newVote);
        }
        return constructBroadcastMessage(targetRoom);
    },
    getStreamableGameState: async function (roomId) {
        const targetRoom = await RoomView.getRoom(roomId);
        if (!targetRoom)
            return null;
        return constructBroadcastMessage(targetRoom);
    },
};
export default RoomView;
//# sourceMappingURL=RoomView.js.map