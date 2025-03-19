const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Game state
const gameState = {
  players: {},
  teams: {
    t: { // Terrorists
      players: {},
      score: 0
    },
    ct: { // Counter-Terrorists
      players: {},
      score: 0
    }
  },
  bullets: [],
  gameInProgress: false,
  roundTime: 120, // 2 minutes per round
  maxRounds: 15,
  currentRound: 0
};

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve the game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO communication
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle player joining
  socket.on('joinGame', (playerData) => {
    // Assign player to a team (balance teams)
    const team = Object.keys(gameState.teams.t.players).length <= Object.keys(gameState.teams.ct.players).length ? 't' : 'ct';
    
    // Create player object
    const player = {
      id: socket.id,
      name: playerData.name || `Player_${socket.id.substring(0, 5)}`,
      team: team,
      position: team === 't' ? {x: -10, y: 1.6, z: 0} : {x: 10, y: 1.6, z: 0}, // Spawn points
      rotation: {x: 0, y: team === 't' ? Math.PI / 2 : -Math.PI / 2, z: 0},
      health: 100,
      weapon: 'rifle',
      ammo: 30,
      kills: 0,
      deaths: 0,
      alive: true
    };
    
    // Add player to game state
    gameState.players[socket.id] = player;
    gameState.teams[team].players[socket.id] = player;
    
    // Send current game state to new player
    socket.emit('gameState', gameState);
    
    // Notify all players of new player
    io.emit('playerJoined', player);
    
    console.log(`Player ${player.name} joined team ${team === 't' ? 'Terrorists' : 'Counter-Terrorists'}`);
    
    // Start game if we have enough players (at least 2 players, 1 on each team)
    checkGameStart();
  });
  
  // Handle player movement
  socket.on('playerMove', (moveData) => {
    if (gameState.players[socket.id] && gameState.players[socket.id].alive) {
      // Update player position
      gameState.players[socket.id].position = moveData.position;
      gameState.players[socket.id].rotation = moveData.rotation;
      
      // Broadcast to all other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: moveData.position,
        rotation: moveData.rotation
      });
    }
  });
  
  // Handle player shooting
  socket.on('playerShoot', (shootData) => {
    if (gameState.players[socket.id] && gameState.players[socket.id].alive) {
      const player = gameState.players[socket.id];
      
      // Check if player has ammo
      if (player.ammo > 0) {
        player.ammo--;
        
        // Create bullet
        const bullet = {
          id: Date.now() + '_' + socket.id,
          origin: {...player.position},
          direction: shootData.direction,
          speed: 100, // Units per second
          damage: 25,
          owner: socket.id,
          team: player.team,
          createdAt: Date.now()
        };
        
        // Add bullet to game state
        gameState.bullets.push(bullet);
        
        // Notify all players of shot
        io.emit('playerShot', {
          playerId: socket.id,
          bullet: bullet
        });
      }
    }
  });
  
  // Handle player reload
  socket.on('playerReload', () => {
    if (gameState.players[socket.id] && gameState.players[socket.id].alive) {
      // Set ammo based on weapon
      if (gameState.players[socket.id].weapon === 'rifle') {
        gameState.players[socket.id].ammo = 30;
      } else if (gameState.players[socket.id].weapon === 'pistol') {
        gameState.players[socket.id].ammo = 12;
      }
      
      // Notify all players
      io.emit('playerReloaded', {
        playerId: socket.id,
        ammo: gameState.players[socket.id].ammo
      });
    }
  });
  
  // Handle player hit
  socket.on('playerHit', (hitData) => {
    const targetId = hitData.targetId;
    const damage = hitData.damage;
    
    if (gameState.players[targetId] && gameState.players[targetId].alive) {
      // Apply damage
      gameState.players[targetId].health -= damage;
      
      // Check if player died
      if (gameState.players[targetId].health <= 0) {
        playerDied(targetId, socket.id);
      }
      
      // Notify all players
      io.emit('playerHit', {
        targetId: targetId,
        damage: damage,
        health: gameState.players[targetId].health,
        shooterId: socket.id
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      const team = gameState.players[socket.id].team;
      
      // Remove player from team
      delete gameState.teams[team].players[socket.id];
      
      // Remove player from game state
      delete gameState.players[socket.id];
      
      // Notify all players
      io.emit('playerLeft', socket.id);
      
      console.log(`Player ${socket.id} disconnected`);
      
      // Check if game should end due to not enough players
      checkGameEnd();
    }
  });
});

// Game logic functions
function checkGameStart() {
  const tCount = Object.keys(gameState.teams.t.players).length;
  const ctCount = Object.keys(gameState.teams.ct.players).length;
  
  // Start game if at least one player on each team
  if (!gameState.gameInProgress && tCount > 0 && ctCount > 0) {
    startGame();
  }
}

function startGame() {
  gameState.gameInProgress = true;
  gameState.currentRound = 1;
  
  // Reset scores
  gameState.teams.t.score = 0;
  gameState.teams.ct.score = 0;
  
  // Reset players
  Object.values(gameState.players).forEach(player => {
    player.health = 100;
    player.ammo = 30;
    player.kills = 0;
    player.deaths = 0;
    player.alive = true;
  });
  
  // Notify all players
  io.emit('gameStarted', {
    round: gameState.currentRound,
    maxRounds: gameState.maxRounds
  });
  
  console.log('Game started!');
  
  // Start round
  startRound();
}

function startRound() {
  // Reset positions to spawn points
  Object.values(gameState.players).forEach(player => {
    player.position = player.team === 't' ? {x: -10, y: 1.6, z: 0} : {x: 10, y: 1.6, z: 0};
    player.rotation = {x: 0, y: player.team === 't' ? Math.PI / 2 : -Math.PI / 2, z: 0};
    player.health = 100;
    player.ammo = 30;
    player.alive = true;
  });
  
  // Clear bullets
  gameState.bullets = [];
  
  // Notify all players
  io.emit('roundStarted', {
    round: gameState.currentRound,
    time: gameState.roundTime
  });
  
  console.log(`Round ${gameState.currentRound} started`);
  
  // Start round timer
  let timeRemaining = gameState.roundTime;
  const roundTimer = setInterval(() => {
    timeRemaining--;
    
    // Update clients every 5 seconds
    if (timeRemaining % 5 === 0 || timeRemaining <= 10) {
      io.emit('timeUpdate', timeRemaining);
    }
    
    // End round if time runs out
    if (timeRemaining <= 0) {
      clearInterval(roundTimer);
      endRound('ct'); // Time ran out, CT win
    }
  }, 1000);
  
  // Store timer reference to clear if round ends early
  gameState.roundTimer = roundTimer;
}

function playerDied(playerId, killerId) {
  if (gameState.players[playerId]) {
    gameState.players[playerId].alive = false;
    gameState.players[playerId].deaths++;
    
    // Increment killer's stats
    if (killerId && gameState.players[killerId]) {
      gameState.players[killerId].kills++;
    }
    
    // Check if round should end
    checkRoundEnd();
  }
}

function checkRoundEnd() {
  // Count alive players on each team
  const tAlive = Object.values(gameState.teams.t.players).filter(p => p.alive).length;
  const ctAlive = Object.values(gameState.teams.ct.players).filter(p => p.alive).length;
  
  // End round if one team is eliminated
  if (tAlive === 0) {
    endRound('ct');
  } else if (ctAlive === 0) {
    endRound('t');
  }
}

function endRound(winningTeam) {
  // Clear round timer if exists
  if (gameState.roundTimer) {
    clearInterval(gameState.roundTimer);
    gameState.roundTimer = null;
  }
  
  // Increment winning team's score
  gameState.teams[winningTeam].score++;
  
  // Notify all players
  io.emit('roundEnded', {
    winner: winningTeam,
    tScore: gameState.teams.t.score,
    ctScore: gameState.teams.ct.score
  });
  
  console.log(`Round ${gameState.currentRound} ended. ${winningTeam === 't' ? 'Terrorists' : 'Counter-Terrorists'} win!`);
  
  // Check if game should end
  if (gameState.teams.t.score >= Math.ceil(gameState.maxRounds / 2) || 
      gameState.teams.ct.score >= Math.ceil(gameState.maxRounds / 2) ||
      gameState.currentRound >= gameState.maxRounds) {
    endGame();
  } else {
    // Start next round after delay
    gameState.currentRound++;
    setTimeout(startRound, 5000);
  }
}

function endGame() {
  const winner = gameState.teams.t.score > gameState.teams.ct.score ? 't' : 'ct';
  
  // Notify all players
  io.emit('gameEnded', {
    winner: winner,
    tScore: gameState.teams.t.score,
    ctScore: gameState.teams.ct.score
  });
  
  console.log(`Game ended. ${winner === 't' ? 'Terrorists' : 'Counter-Terrorists'} win!`);
  
  // Reset game state
  gameState.gameInProgress = false;
  gameState.currentRound = 0;
  gameState.bullets = [];
  
  // Start new game after delay if enough players
  setTimeout(() => {
    checkGameStart();
  }, 10000);
}

function checkGameEnd() {
  const tCount = Object.keys(gameState.teams.t.players).length;
  const ctCount = Object.keys(gameState.teams.ct.players).length;
  
  // End game if not enough players
  if (gameState.gameInProgress && (tCount === 0 || ctCount === 0)) {
    // End current round
    if (tCount === 0) {
      endRound('ct');
    } else {
      endRound('t');
    }
    
    // End game
    endGame();
  }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});