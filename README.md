Introduction

This project is a two-player turn-based game implemented using Node.js and WebSocket. The server manages the game state and communicates with two clients (players) in real-time, updating them about valid moves, turns, and game results.

 Features

- Real-time multiplayer using WebSocket.
- Turn-based gameplay for two players.
- Movement rules and validation for each player's pieces.
- Automatic turn switching and move validation.
- Basic user interface with HTML, CSS, and JavaScript.
  Game Rules

- The game is played on a 5x5 grid.
- Each player has a set of pieces (Pawns `P1, P2, P3` and Heroes `H1, H2`).
- Players take turns to move one piece at a time.
- Each piece has different movement abilities:
  - **Pawn (`P1, P2, P3`)**: Can move left (`L`), right (`R`), forward (`F`), and backward (`B`).
  - **Hero1 (`H1`)**: Moves like pawns.
  - **Hero2 (`H2`)**: Can move diagonally forward left (`FL`), forward right (`FR`), backward left (`BL`), and backward right (`BR`).

- A move is valid only if it lands on an empty cell or captures an opponent's piece.
- A move is invalid if it:
  - Goes out of the board bounds.
  - Lands on a cell occupied by another piece of the same player.
  - Tries to move out of turn.

- The game ends when all of one player's pieces are captured.
  How to Play

1. **Start the game**:
   - Connect two players by opening `index.html` in two separate browser tabs or windows.

2. **Gameplay**:
   - The game starts with Player A's turn.
   - Select a piece by clicking on it and then choose a move direction by clicking the corresponding button (`L`, `R`, `F`, `B`, etc.).
   - The server will validate the move and, if valid, switch turns to the next player.
   - Continue playing until a game-over condition is met.

3. **Game Over**:
   - The game ends when one player captures all of the opponent's pieces.
   - The server will notify both players when the game is over.

