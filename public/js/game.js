class Game {
    constructor() {
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.socket = null;
      this.players = {};
      this.localPlayer = null;
      this.map = null;
      this.weapon = null;
      this.bullets = [];
      this.effects = [];
      this.clock = new THREE.Clock();
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.collidableObjects = [];
      this.playerHeight = 1.6;
      this.moveSpeed = 5;
      this.canShoot = true;
      this.shooting = false;
      this.lastShotTime = 0;
      this.gameRunning = false;
      this.playerName = '';
      
      // Movement states
      this.movement = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false
      };
      
      // Bind methods
      this.animate = this.animate.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
    }
    
    init() {
      // Initialize loading screen
      this.showLoadingScreen();
      
      // Initialize Three.js
      this.initThree();
      
      // Initialize UI
      this.initUI();
      
      // Initialize controls
      this.initControls();
      
      // Initialize map
      this.initMap();
      
      // Initialize weapon
      this.initWeapon();
      
      // Adjust weapon properties 
      this.adjustWeaponProperties();
      
      // Initialize keyboard and mouse events
      this.initEventListeners();
      
      // Start animation loop
      this.animate();
      
      // Hide loading screen immediately
      this.hideLoadingScreen();
      this.showLoginScreen();
    }
    
    initThree() {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
      this.scene.fog = new THREE.Fog(0x87ceeb, 10, 50);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
      );
      this.camera.position.set(0, this.playerHeight, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('game-container').appendChild(this.renderer.domElement);
      
      // Handle window resize
      window.addEventListener('resize', this.onWindowResize);
    }
    
    initUI() {
      // Login button handler
      document.getElementById('join-game-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim() || `Player_${Math.floor(Math.random() * 1000)}`;
        this.playerName = name;
        this.hideLoginScreen();
        this.connect();
      });
      
      // Press Enter to join
      document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('join-game-btn').click();
        }
      });
    }
    
    initControls() {
      // Initialize pointer lock controls using the imported module
      this.controls = new window.PointerLockControls(this.camera, document.body);
      
      // Lock pointer on click (if game is running)
      document.addEventListener('click', () => {
        if (this.gameRunning && !this.controls.isLocked) {
          this.controls.lock();
        }
      });
      
      // When controls lock, hide UI
      this.controls.addEventListener('lock', () => {
        document.getElementById('crosshair').style.display = 'block';
      });
      
      // When controls unlock, show UI
      this.controls.addEventListener('unlock', () => {
        document.getElementById('crosshair').style.display = 'none';
      });
    }
    
    initMap() {
      // Create map
      this.map = new GameMap(this.scene);
      this.collidableObjects = this.map.create();
    }
    
    initWeapon() {
      // Create default weapon (rifle)
      this.weapon = createWeapon('rifle');
      
      // Create weapon model for first-person view
      const weaponModel = this.weapon.createModel();
      weaponModel.position.set(0.3, -0.3, -0.5); // Position in front of camera
      this.camera.add(weaponModel);
    }
    
    adjustWeaponProperties() {
      // Slow down fire rates to make shooting more manageable
      if (this.weapon) {
        // Reduce fire rates (higher number = slower firing)
        this.weapon.fireRate = this.weapon.fireRate / 3;
        
        // Increase recoil for more noticeable effect
        this.weapon.recoil = this.weapon.recoil * 1.5;
        
        console.log("Weapon properties adjusted:", this.weapon);
      }
    }
    
    initEventListeners() {
      // Keyboard events
      document.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('keyup', this.onKeyUp);
      
      // Mouse events
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
    }
    
    onKeyDown(event) {
      if (!this.gameRunning || !this.controls.isLocked) return;
      
      switch (event.code) {
        case 'KeyW':
          this.movement.forward = true;
          break;
        case 'KeyS':
          this.movement.backward = true;
          break;
        case 'KeyA':
          this.movement.left = true;
          break;
        case 'KeyD':
          this.movement.right = true;
          break;
        case 'ShiftLeft':
          this.movement.sprint = true;
          break;
        case 'KeyR':
          this.reload();
          break;
      }
    }
    
    onKeyUp(event) {
      if (!this.gameRunning) return;
      
      switch (event.code) {
        case 'KeyW':
          this.movement.forward = false;
          break;
        case 'KeyS':
          this.movement.backward = false;
          break;
        case 'KeyA':
          this.movement.left = false;
          break;
        case 'KeyD':
          this.movement.right = false;
          break;
        case 'ShiftLeft':
          this.movement.sprint = false;
          break;
      }
    }
    
    onMouseMove(event) {
      if (!this.gameRunning || !this.controls.isLocked) return;
      
      // Update mouse position for raycasting
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    onMouseDown(event) {
      if (!this.gameRunning || !this.controls.isLocked) return;
      
      // Left mouse button (shoot)
      if (event.button === 0) {
        this.shooting = true;
        this.shoot();
      }
    }
    
    onMouseUp(event) {
      if (!this.gameRunning) return;
      
      // Left mouse button
      if (event.button === 0) {
        this.shooting = false;
      }
    }
    
    connect() {
      // Connect to server
      this.socket = io();
      
      // Socket event handlers
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.joinGame();
      });
      
      this.socket.on('gameState', (gameState) => {
        this.handleGameState(gameState);
      });
      
      this.socket.on('playerJoined', (player) => {
        this.addPlayer(player);
      });
      
      this.socket.on('playerMoved', (moveData) => {
        this.updatePlayerPosition(moveData);
      });
      
      this.socket.on('playerShot', (shotData) => {
        this.handlePlayerShot(shotData);
      });
      
      this.socket.on('playerHit', (hitData) => {
        this.handlePlayerHit(hitData);
      });
      
      this.socket.on('playerReloaded', (reloadData) => {
        this.handlePlayerReload(reloadData);
      });
      
      this.socket.on('playerLeft', (playerId) => {
        this.removePlayer(playerId);
      });
      
      this.socket.on('gameStarted', (gameData) => {
        this.handleGameStart(gameData);
      });
      
      this.socket.on('roundStarted', (roundData) => {
        this.handleRoundStart(roundData);
      });
      
      this.socket.on('roundEnded', (roundData) => {
        this.handleRoundEnd(roundData);
      });
      
      this.socket.on('gameEnded', (gameData) => {
        this.handleGameEnd(gameData);
      });
      
      this.socket.on('timeUpdate', (timeRemaining) => {
        this.updateTimeDisplay(timeRemaining);
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.handleDisconnect();
      });
    }
    
    joinGame() {
      // Send join request to server
      this.socket.emit('joinGame', {
        name: this.playerName
      });
      
      // Start game
      this.gameRunning = true;
      this.controls.lock();
    }
    
    handleGameState(gameState) {
      // Add all existing players
      Object.values(gameState.players).forEach(playerData => {
        if (playerData.id !== this.socket.id) {
          this.addPlayer(playerData);
        }
      });
      
      // Set up local player
      const localPlayerData = gameState.players[this.socket.id];
      if (localPlayerData) {
        this.localPlayer = new Player(this, this.socket.id, localPlayerData);
        this.localPlayer.setAsLocalPlayer();
        
        // Set camera position to spawn point
        this.camera.position.set(
          localPlayerData.position.x,
          localPlayerData.position.y,
          localPlayerData.position.z
        );
        
        // Update team UI
        document.body.classList.add(localPlayerData.team === 't' ? 't-team' : 'ct-team');
        
        // Update weapon ammo display
        document.querySelector('.ammo-value').textContent = localPlayerData.ammo;
      }
      
      // Update score display
      this.updateScoreDisplay(gameState.teams.t.score, gameState.teams.ct.score);
      
      // Update round display
      this.updateRoundDisplay(gameState.currentRound, gameState.maxRounds);
  
      // Spawn bots to fill teams
      setTimeout(() => {
        this.spawnBots();
        console.log("Bots spawned to fill teams");
      }, 2000);
    }
    
    spawnBots() {
      const teamSizes = {
        t: 0,
        ct: 0
      };
      
      // Count existing players on each team
      Object.values(this.players).forEach(player => {
        teamSizes[player.team]++;
      });
      
      // Add bots to fill teams up to 5 players each
      for (let team of ['t', 'ct']) {
        const botsNeeded = 5 - teamSizes[team];
        
        for (let i = 0; i < botsNeeded; i++) {
          // Create random bot data
          const botId = 'bot_' + team + '_' + i;
          const botData = {
            id: botId,
            name: 'Bot_' + team.toUpperCase() + '_' + i,
            team: team,
            position: team === 't' ? {x: -15 + Math.random() * 5, y: 1.6, z: Math.random() * 10 - 5} 
                                 : {x: 15 - Math.random() * 5, y: 1.6, z: Math.random() * 10 - 5},
            rotation: {x: 0, y: team === 't' ? Math.PI / 2 : -Math.PI / 2, z: 0},
            health: 100,
            weapon: 'rifle',
            ammo: 30,
            kills: 0,
            deaths: 0,
            alive: true,
            isBot: true
          };
          
          // Add bot to players list
          this.addPlayer(botData);
          
          // Make bots move randomly
          this.startBotBehavior(botId);
        }
      }
    }
    
    startBotBehavior(botId) {
      const bot = this.players[botId];
      if (!bot) return;
      
      // Set up random movement interval
      const moveInterval = setInterval(() => {
        if (!this.gameRunning || !bot || !bot.alive) {
          clearInterval(moveInterval);
          return;
        }
        
        // Random movement
        const newPos = {
          x: bot.model.position.x + (Math.random() - 0.5) * 2,
          y: bot.model.position.y,
          z: bot.model.position.z + (Math.random() - 0.5) * 2
        };
        
        // Keep within team area boundaries
        if (bot.team === 't') {
          newPos.x = Math.max(-23, Math.min(-8, newPos.x));
        } else {
          newPos.x = Math.max(8, Math.min(23, newPos.x));
        }
        
        newPos.z = Math.max(-23, Math.min(23, newPos.z));
        
        // Update position
        bot.model.position.set(newPos.x, newPos.y, newPos.z);
        
        // Random rotation
        const newRotY = bot.model.rotation.y + (Math.random() - 0.5) * 0.5;
        bot.model.rotation.y = newRotY;
        
        // Occasionally shoot
        if (Math.random() < 0.2) {
          // Create direction vector from bot position facing forward
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(bot.model.quaternion);
          
          // Create bullet
          const bullet = new Bullet(
            this.scene,
            bot.model.position.clone(),
            direction,
            100,
            botId
          );
          
          this.bullets.push(bullet);
          
          // Show muzzle flash
          const muzzleFlashEffect = createMuzzleFlash(
            this.scene, 
            bot.model.position.clone(), 
            direction
          );
          this.effects.push(muzzleFlashEffect);
        }
      }, 1000);
      
      // Occasionally take aim at the player
      const aimInterval = setInterval(() => {
        if (!this.gameRunning || !bot || !bot.alive || !this.localPlayer) {
          clearInterval(aimInterval);
          return;
        }
        
        // 25% chance to aim at player
        if (Math.random() < 0.25) {
          // Get direction to player
          const toPlayer = new THREE.Vector3();
          toPlayer.subVectors(this.camera.position, bot.model.position);
          toPlayer.y = 0; // Keep on horizontal plane
          
          // Set bot rotation to face player
          bot.model.lookAt(
            bot.model.position.x + toPlayer.x,
            bot.model.position.y,
            bot.model.position.z + toPlayer.z
          );
        }
      }, 2000);
    }
    
    addPlayer(playerData) {
      if (playerData.id === this.socket.id) return;
      
      // Create new player
      const player = new Player(this, playerData.id, playerData);
      this.players[playerData.id] = player;
      
      // Add kill feed message
      if (!playerData.isBot) {
        this.addKillFeedMessage(`${playerData.name} joined the game`, playerData.team);
      } else {
        this.addKillFeedMessage(`Bot ${playerData.name} added to game`, playerData.team);
      }
    }
    
    updatePlayerPosition(moveData) {
      const player = this.players[moveData.id];
      if (player) {
        player.update({
          position: moveData.position,
          rotation: moveData.rotation
        });
      }
    }
    
    handlePlayerShot(shotData) {
      const player = this.players[shotData.playerId];
      if (player) {
        // Play shooting animation
        player.shoot();
        
        // Create muzzle flash effect
        const position = new THREE.Vector3(
          shotData.bullet.origin.x,
          shotData.bullet.origin.y,
          shotData.bullet.origin.z
        );
        
        const direction = new THREE.Vector3(
          shotData.bullet.direction.x,
          shotData.bullet.direction.y,
          shotData.bullet.direction.z
        );
        
        const muzzleFlashEffect = createMuzzleFlash(this.scene, position, direction);
        this.effects.push(muzzleFlashEffect);
        
        // Create bullet visualization
        const bullet = new Bullet(
          this.scene,
          position,
          direction,
          shotData.bullet.speed,
          shotData.bullet.owner
        );
        
        this.bullets.push(bullet);
        
        // Play sound
        // this.playSound(player.weapon.getAudioFile());
      }
    }
    
    handlePlayerHit(hitData) {
      const player = this.players[hitData.targetId];
      if (player) {
        player.update({ health: hitData.health });
      }
      
      // If local player was hit
      if (hitData.targetId === this.socket.id && this.localPlayer) {
        this.localPlayer.takeDamage(hitData.damage);
      }
      
      // If local player got a hit
      if (hitData.shooterId === this.socket.id) {
        // Play hit marker sound
        // this.playSound('sounds/hit_marker.mp3');
        
        // Show hit marker
        this.showHitMarker();
      }
    }
    
    handlePlayerReload(reloadData) {
      const player = this.players[reloadData.playerId];
      if (player) {
        player.reload();
      }
    }
    
    removePlayer(playerId) {
      if (this.players[playerId]) {
        // Remove player model
        this.players[playerId].remove();
        
        // Remove player from list
        delete this.players[playerId];
      }
    }
    
    handleGameStart(gameData) {
      // Update UI
      this.updateRoundDisplay(gameData.round, gameData.maxRounds);
      
      // Reset scores
      this.updateScoreDisplay(0, 0);
      
      // Show game start message
      this.showMessage('Game Started!', 3000);
    }
    
    handleRoundStart(roundData) {
      // Update round display
      this.updateRoundDisplay(roundData.round, 15);
      
      // Reset timer
      this.updateTimeDisplay(roundData.time);
      
      // Reset local player if exists
      if (this.localPlayer) {
        this.localPlayer.respawn();
      }
      
      // Show round start message
      this.showMessage(`Round ${roundData.round} Started!`, 3000);
      
      // Hide round end screen if visible
      document.getElementById('round-end-screen').style.display = 'none';
    }
    
    handleRoundEnd(roundData) {
      // Update scores
      this.updateScoreDisplay(roundData.tScore, roundData.ctScore);
      
      // Show round end screen
      const roundEndScreen = document.getElementById('round-end-screen');
      const roundWinner = document.getElementById('round-winner');
      const tScoreValue = document.querySelector('.t-score-value');
      const ctScoreValue = document.querySelector('.ct-score-value');
      
      // Set winner text
      if (roundData.winner === 't') {
        roundWinner.textContent = 'Terrorists Win!';
        roundWinner.className = 't-winner';
      } else {
        roundWinner.textContent = 'Counter-Terrorists Win!';
        roundWinner.className = 'ct-winner';
      }
      
      // Update scores
      tScoreValue.textContent = roundData.tScore;
      ctScoreValue.textContent = roundData.ctScore;
      
      // Show screen
      roundEndScreen.style.display = 'flex';
      
      // Start next round countdown
      let timeLeft = 5;
      const nextRoundTime = document.getElementById('next-round-time');
      nextRoundTime.textContent = timeLeft;
      
      const countdown = setInterval(() => {
        timeLeft--;
        nextRoundTime.textContent = timeLeft;
        
        if (timeLeft <= 0) {
          clearInterval(countdown);
        }
      }, 1000);
    }
    
    handleGameEnd(gameData) {
      // Update scores
      this.updateScoreDisplay(gameData.tScore, gameData.ctScore);
      
      // Hide round end screen if visible
      document.getElementById('round-end-screen').style.display = 'none';
      
      // Show game end screen
      const gameEndScreen = document.getElementById('game-end-screen');
      const gameWinner = document.getElementById('game-winner');
      const tFinalScore = document.querySelector('.t-final-score');
      const ctFinalScore = document.querySelector('.ct-final-score');
      const playerKills = document.getElementById('player-kills');
      const playerDeaths = document.getElementById('player-deaths');
      const playerKD = document.getElementById('player-kd');
      
      // Set winner text
      if (gameData.winner === 't') {
        gameWinner.textContent = 'Terrorists Win!';
        gameWinner.className = 't-winner';
      } else {
        gameWinner.textContent = 'Counter-Terrorists Win!';
        gameWinner.className = 'ct-winner';
      }
      
      // Update scores
      tFinalScore.textContent = gameData.tScore;
      ctFinalScore.textContent = gameData.ctScore;
      
      // Update player stats
      if (this.localPlayer) {
        playerKills.textContent = this.localPlayer.kills;
        playerDeaths.textContent = this.localPlayer.deaths;
        const kd = this.localPlayer.deaths === 0 ? this.localPlayer.kills : (this.localPlayer.kills / this.localPlayer.deaths).toFixed(2);
        playerKD.textContent = kd;
      }
      
      // Show screen
      gameEndScreen.style.display = 'flex';
      
      // Start next game countdown
      let timeLeft = 10;
      const nextGameTime = document.getElementById('next-game-time');
      nextGameTime.textContent = timeLeft;
      
      const countdown = setInterval(() => {
        timeLeft--;
        nextGameTime.textContent = timeLeft;
        
        if (timeLeft <= 0) {
          clearInterval(countdown);
          // Hide game end screen
          gameEndScreen.style.display = 'none';
        }
      }, 1000);
    }
    
    updateTimeDisplay(timeRemaining) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      document.querySelector('.time-value').textContent = timeString;
    }
    
    updateScoreDisplay(tScore, ctScore) {
      document.querySelector('.t-score').textContent = tScore;
      document.querySelector('.ct-score').textContent = ctScore;
    }
    
    updateRoundDisplay(currentRound, maxRounds) {
      document.querySelector('.round-value').textContent = `${currentRound}/${maxRounds}`;
    }
    
    handleDisconnect() {
      // Show message
      this.showMessage('Disconnected from server. Refresh to reconnect.', 0);
      
      // Stop game
      this.gameRunning = false;
      this.controls.unlock();
      
      // Clear all players
      Object.keys(this.players).forEach(playerId => {
        this.removePlayer(playerId);
      });
      
      // Clear local player
      if (this.localPlayer) {
        this.localPlayer.remove();
        this.localPlayer = null;
      }
      
      // Show login screen
      this.showLoginScreen();
    }
    
    shoot() {
      if (!this.localPlayer || !this.localPlayer.alive || !this.canShoot) return;
      
      const now = performance.now();
      const timeSinceLastShot = now - this.lastShotTime;
      
      // Limit fire rate based on weapon
      if ((this.weapon.automatic && timeSinceLastShot > (1000 / this.weapon.fireRate))
          || (!this.weapon.automatic && timeSinceLastShot > (1000 / this.weapon.fireRate) && this.shooting)) {
        
        // Get camera direction
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Apply weapon spread
        const spread = this.weapon.fire().spread;
        const direction = this.raycaster.ray.direction.clone();
        direction.x += spread.x;
        direction.y += spread.y;
        direction.normalize();
        
        // Send shot to server
        this.socket.emit('playerShoot', {
          direction: {
            x: direction.x,
            y: direction.y,
            z: direction.z
          }
        });
        
        // Apply recoil as temporary view shake (not permanent movement)
        this.applyViewShake(this.weapon.fire().recoil);
        
        // Update ammo display
        this.localPlayer.ammo--;
        document.querySelector('.ammo-value').textContent = this.localPlayer.ammo;
        
        // Update last shot time
        this.lastShotTime = now;
        
        // Check if out of ammo
        if (this.localPlayer.ammo <= 0) {
          this.reload();
        }
        
        // Add cooldown for non-automatic weapons
        if (!this.weapon.automatic) {
          this.canShoot = false;
          setTimeout(() => {
            this.canShoot = true;
          }, 1000 / this.weapon.fireRate);
        }
      }
    }
    
    applyViewShake(amount) {
      // Save original rotation
      const originalRotation = this.camera.rotation.x;
      
      // Apply upward recoil
      this.camera.rotation.x -= amount;
      
      // Apply random horizontal shake
      const horizontalShake = (Math.random() - 0.5) * amount * 0.5;
      this.camera.rotation.y += horizontalShake;
      
      // Return to original position with a slight delay
      setTimeout(() => {
        // Use GSAP for smooth transition back
        gsap.to(this.camera.rotation, {
          x: originalRotation,
          y: this.camera.rotation.y - horizontalShake,
          duration: 0.1
        });
      }, 50);
    }
    
    reload() {
      if (!this.localPlayer || !this.localPlayer.alive) return;
      
      // Send reload to server
      this.socket.emit('playerReload');
      
      // Local reload effect
      this.localPlayer.reload();
      this.showMessage('Reloading...', 1500);
      
      // Disable shooting during reload
      this.canShoot = false;
      setTimeout(() => {
        this.canShoot = true;
      }, this.weapon.reloadTime * 1000);
    }
    
    showHitMarker() {
      // Create hit marker element
      const hitMarker = document.createElement('div');
      hitMarker.className = 'hit-marker';
      hitMarker.innerHTML = '✕';
      document.getElementById('game-ui').appendChild(hitMarker);
      
      // Remove after a short time
      setTimeout(() => {
        document.getElementById('game-ui').removeChild(hitMarker);
      }, 100);
    }
    
    addKillFeedMessage(message, team) {
      const killFeed = document.getElementById('kill-feed');
      const killMessage = document.createElement('div');
      killMessage.className = 'kill-message';
      
      // Add team color class if team is provided
      if (team) {
        killMessage.classList.add(team === 't' ? 't-player' : 'ct-player');
      }
      
      killMessage.textContent = message;
      killFeed.appendChild(killMessage);
      
      // Remove oldest message if more than 5
      if (killFeed.children.length > 5) {
        killFeed.removeChild(killFeed.children[0]);
      }
      
      // Auto-remove after a few seconds
      setTimeout(() => {
        if (killFeed.contains(killMessage)) {
          killFeed.removeChild(killMessage);
        }
      }, 5000);
    }
    
    showMessage(message, duration) {
      const messageElement = document.createElement('div');
      messageElement.className = 'game-message';
      messageElement.textContent = message;
      document.getElementById('game-ui').appendChild(messageElement);
      
      // Auto-remove after duration (if not 0)
      if (duration > 0) {
        setTimeout(() => {
          if (document.getElementById('game-ui').contains(messageElement)) {
            document.getElementById('game-ui').removeChild(messageElement);
          }
        }, duration);
      }
    }
    
    showLoadingScreen() {
      document.getElementById('loading-screen').style.display = 'flex';
    }
    
    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
      }
      
      showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
      }
      
      hideLoginScreen() {
        document.getElementById('login-screen').style.display = 'none';
      }
      
      onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
      
      update(deltaTime) {
        // Handle player movement
        if (this.gameRunning && this.controls.isLocked && this.localPlayer && this.localPlayer.alive) {
          const speed = this.movement.sprint ? this.moveSpeed * 1.5 : this.moveSpeed;
          const moveDistance = speed * deltaTime;
          
          // Get movement direction
          const direction = new THREE.Vector3();
          
          // Forward/backward
          if (this.movement.forward) {
            direction.z -= 1;
          }
          if (this.movement.backward) {
            direction.z += 1;
          }
          
          // Left/right
          if (this.movement.left) {
            direction.x -= 1;
          }
          if (this.movement.right) {
            direction.x += 1;
          }
          
          // Normalize for consistent speed in all directions
          if (direction.length() > 0) {
            direction.normalize();
          }
          
          // Apply camera rotation to movement direction
          direction.applyQuaternion(this.camera.quaternion);
          
          // Zero out Y component to keep movement horizontal
          direction.y = 0;
          direction.normalize();
          
          // Calculate new position
          const newPosition = this.camera.position.clone();
          newPosition.x += direction.x * moveDistance;
          newPosition.z += direction.z * moveDistance;
          
          // Collision detection
          const playerRadius = 0.3;
          let canMove = true;
          
          // Check collision with map objects
          this.collidableObjects.forEach(object => {
            const objectBounds = new THREE.Box3().setFromObject(object);
            const playerBounds = new THREE.Sphere(newPosition, playerRadius);
            
            if (objectBounds.intersectsSphere(playerBounds)) {
              canMove = false;
            }
          });
          
          // Move if no collision
          if (canMove) {
            this.camera.position.copy(newPosition);
            
            // Send position update to server
            this.socket.emit('playerMove', {
              position: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
              },
              rotation: {
                x: this.camera.rotation.x,
                y: this.camera.rotation.y,
                z: this.camera.rotation.z
              }
            });
          }
        }
        
        // Auto-fire if holding mouse button
        if (this.shooting && this.weapon.automatic) {
          this.shoot();
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const active = this.bullets[i].update(deltaTime);
          if (!active) {
            this.bullets.splice(i, 1);
          }
        }
        
        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
          const active = this.effects[i](deltaTime);
          if (!active) {
            this.effects.splice(i, 1);
          }
        }
      }
      
      animate() {
        requestAnimationFrame(this.animate);
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        this.update(deltaTime);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
      }
    }