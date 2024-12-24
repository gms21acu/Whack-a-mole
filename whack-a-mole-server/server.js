const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

let players = [];
let gameInProgress = false;
let playerIdCounter = 1;  // Counter to generate unique player IDs
let highScores = [];  // Array to hold the high scores

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Assign a unique player ID
  const playerId = playerIdCounter++;
  ws.playerId = playerId;
  
  // Send the player ID to the client
  ws.send(JSON.stringify({ type: 'yourId', playerId: ws.playerId }));

  // Send the high scores list to the player
  ws.send(JSON.stringify({ type: 'scores', scores: highScores }));

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    const data = JSON.parse(message);

    if (data.type === 'score') {
      // Update the player's score
      const player = players.find(p => p.ws === ws);
      if (player) {
        player.score += data.points;
      }
      broadcastScores();
    } else if (data.type === 'startGame' && !gameInProgress) {
      startGame();
    }
  });

  ws.on('close', () => {
    // Remove the player from the array when they disconnect
    players = players.filter((player) => player.ws !== ws);
    console.log(`Player ${ws.playerId} disconnected`);
  });

  // Add the new player to the players list
  players.push({ ws, playerId, score: 0 });
});

// Broadcast updated high scores to all players
function broadcastScores() {
  // Sort players by score in descending order
  const sortedScores = players.map(player => ({
    playerId: player.playerId,
    score: player.score
  })).sort((a, b) => b.score - a.score);

  highScores = sortedScores;  // Update the global high scores array

  // Broadcast the updated high scores to all players
  players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({ type: 'scores', scores: sortedScores }));
    }
  });
}

function startGame() {
  console.log('Game started');
  gameInProgress = true;
  broadcast({ type: 'start' });

  // End the game after 60 seconds
  setTimeout(endGame, 60000);
}

function endGame() {
  console.log('Game ended');
  gameInProgress = false;

  // Find the player with the highest score
  let highestScore = -1;
  players.forEach((player) => {
    if (player.score > highestScore) highestScore = player.score;
  });

  // Update the high scores list
  broadcast({ type: 'end', winner: highestScore });

  // Reset scores for all players after game ends
  players.forEach(player => {
    player.score = 0;
  });
}

// Broadcast a message to all players
function broadcast(message) {
  players.forEach((player) => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

console.log(`WebSocket server running on port ${PORT}`);
