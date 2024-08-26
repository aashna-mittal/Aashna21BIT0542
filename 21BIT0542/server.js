const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    board: [
        "A-P1", "A-P2", "A-H1", "A-H2", "A-P3",
        "", "", "", "", "",
        "", "", "", "", "",
        "", "", "", "", "",
        "B-P1", "B-P2", "B-H1", "B-H2", "B-P3"
    ],
    players: [],
    currentTurn: 0, // 0 for player A, 1 for player B
};

wss.on('connection', function connection(ws) {
    if (gameState.players.length < 2) {
        const playerId = gameState.players.length === 0 ? 'A' : 'B';
        gameState.players.push({ ws, id: playerId });
        ws.send(JSON.stringify({ type: 'init', playerId, board: gameState.board }));

        console.log(`Player connected: ${playerId}, Total players: ${gameState.players.length}`);

        if (gameState.players.length === 2) {
            broadcast({ type: 'start', message: 'Game Start! Player A begins.' });
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is already full.' }));
        ws.close();
    }

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message); // Try parsing the incoming message
            handlePlayerMove(data, ws);
        } catch (error) {
            console.error("Invalid JSON format received:", message); // Log the invalid JSON
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format.' })); // Inform the client of the error
        }
    });

    ws.on('close', function close() {
        gameState.players = gameState.players.filter(player => player.ws !== ws);
        console.log('Player disconnected, remaining players:', gameState.players.length);
        if (gameState.players.length === 0) {
            resetGame();
        }
    });
});

function handlePlayerMove(data, ws) {
    const player = gameState.players.find(player => player.ws === ws);
    console.log(`Received move from player: ${player ? player.id : 'Unknown'}, Current turn: ${getCurrentPlayerId()}`);

    if (!player || player.id !== getCurrentPlayerId()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not your turn!' }));
        return;
    }

    if (isValidMove(data, player.id)) {
        updateGameState(data, player.id);
        broadcast({ type: 'update', board: gameState.board, currentTurn: gameState.currentTurn });
        if (checkForWin(player.id)) {
            broadcast({ type: 'gameOver', message: `Player ${player.id} wins!` });
            resetGame();
        } else {
            gameState.currentTurn = 1 - gameState.currentTurn; // Switch turns
            console.log(`Turn switched to: ${getCurrentPlayerId()}`);
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid move!' }));
    }
}

function isValidMove(data, playerId) {
    const { character, move } = data;
    const characterIndex = gameState.board.indexOf(character);

    console.log(`Character: ${character}, Player: ${playerId}`);

    if (characterIndex === -1) {
        console.log("Invalid move: Character does not exist on the board.");
        return false;
    }

    if (!character.startsWith(playerId)) {
        console.log("Invalid move: Character does not belong to the player.");
        return false;
    }

    const targetIndex = getTargetIndex(characterIndex, move, character);

    console.log(`Character Index: ${characterIndex}, Move: ${move}, Target Index: ${targetIndex}`);

    if (targetIndex === null) {
        console.log("Invalid move: Calculated target index is null.");
        return false;
    }

    if (targetIndex < 0 || targetIndex >= gameState.board.length) {
        console.log("Invalid move: Target index is out of bounds.");
        return false;
    }

    if (gameState.board[targetIndex] && gameState.board[targetIndex].startsWith(playerId)) {
        console.log("Invalid move: Target cell contains player's own character.");
        return false;
    }

    console.log("Move is valid.");
    return true;
}

function getTargetIndex(index, move, character) {
    const characterType = character.split('-')[1]; // Correctly extract the type part

    switch (characterType) {
        case 'P1': // Pawn
        case 'P2':
        case 'P3':
            switch (move) {
                case 'L': return (index % 5 === 0) ? null : index - 1;  // Move left
                case 'R': return (index % 5 === 4) ? null : index + 1;  // Move right
                case 'F': return (index >= 5) ? index - 5 : null;        // Move forward
                case 'B': return (index < 20) ? index + 5 : null;        // Move backward
                default: return null;
            }
        case 'H1': // Hero1 (same rules as Pawn in this context)
            switch (move) {
                case 'L': return (index % 5 === 0) ? null : index - 1;
                case 'R': return (index % 5 === 4) ? null : index + 1;
                case 'F': return (index >= 5) ? index - 5 : null;
                case 'B': return (index < 20) ? index + 5 : null;
                default: return null;
            }
            case 'H2': // Hero2 (different diagonal moves)
            switch (move) {
                case 'FL': return (index % 5 === 0 || index < 5) ? null : index - 6;
                case 'FR': return (index % 5 === 4 || index < 5) ? null : index - 4;
                case 'BL': return (index % 5 === 0 || index >= 20) ? null : index + 4;
                case 'BR': return (index % 5 === 4 || index >= 20) ? null : index + 6;
                case 'B': return (index < 20) ? index + 5 : null; // Added for backward movement
                default: return null;
            }
        
        default:
            console.log("Invalid character type.");
            return null;
    }
}

function updateGameState(data, playerId) {
    const { character, move } = data;
    const characterIndex = gameState.board.indexOf(character);
    const targetIndex = getTargetIndex(characterIndex, move, character);

    if (targetIndex !== null && targetIndex >= 0 && targetIndex < gameState.board.length) {
        // Move the character to the target position
        gameState.board[targetIndex] = character;
        // Clear the original position
        gameState.board[characterIndex] = "";
    }
}

function getCurrentPlayerId() {
    return gameState.currentTurn === 0 ? 'A' : 'B';
}

function broadcast(data) {
    gameState.players.forEach(player => {
        player.ws.send(JSON.stringify(data));
    });
}

function checkForWin(playerId) {
    const opponentId = playerId === 'A' ? 'B' : 'A';
    return gameState.board.every(cell => !cell.startsWith(opponentId));
}
function checkForGameOver() {
    if (gameState.board.every(cell => !cell.startsWith('A'))) {
        broadcast({ type: 'gameOver', message: 'Player B wins!' });
        resetGame();
        return true;
    } else if (gameState.board.every(cell => !cell.startsWith('B'))) {
        broadcast({ type: 'gameOver', message: 'Player A wins!' });
        resetGame();
        return true;
    }
    return false;
}


function resetGame() {
    gameState.board = [
        "A-P1", "A-P2", "A-H1", "A-H2", "A-P3",
        "", "", "", "", "",
        "", "", "", "", "",
        "", "", "", "", "",
        "B-P1", "B-P2", "B-H1", "B-H2", "B-P3"
    ];
    gameState.currentTurn = 0;
    gameState.players = [];
    console.log('Game reset. Ready for new game.');
}

console.log('WebSocket server is running on ws://localhost:8080');
