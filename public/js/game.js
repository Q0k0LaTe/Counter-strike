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
      // No need to slow down fire rates anymore - we want faster shooting
      if (this.weapon) {
        console.log("Weapon properties adjusted:", this.weapon);
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
      
      // Bullet collision detection
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        if (!bullet.active) continue;
        
        // Get shooter's team
        let shooterTeam = null;
        if (bullet.owner === this.socket.id) {
          shooterTeam = this.localPlayer.team;
        } else if (this.players[bullet.owner]) {
          shooterTeam = this.players[bullet.owner].team;
        } else if (bullet.owner.startsWith('bot_')) {
          // Extract team from bot ID (format: bot_t_0 or bot_ct_0)
          shooterTeam = bullet.owner.split('_')[1];
        }
        
        if (!shooterTeam) continue;
        
        // Check for collisions with map objects first
        const bulletPosition = bullet.mesh.position.clone();
        const bulletRadius = 0.1;
        const bulletSphere = new THREE.Sphere(bulletPosition, bulletRadius);
        
        let collision = false;
        
        // Check for player collisions if no map collision
        if (!collision) {
          // Get all potential targets (other team)
          const potentialTargets = Object.values(this.players).filter(player => 
            player.alive && player.team !== shooterTeam
          );
          
          for (const target of potentialTargets) {
            // Skip if it's a bot bullet hitting another bot (for performance)
            if (bullet.owner.startsWith('bot_') && target.isBot) continue;
            
            // Create a collision box for the target
            const targetBox = new THREE.Box3().setFromObject(target.model);
            
            if (targetBox.intersectsSphere(bulletSphere)) {
              collision = true;
              
              // Apply damage
              const damage = 25; // Standard damage
              target.takeDamage(damage);
              
              // Create hit effect
              const hitPosition = bulletPosition.clone();
              const hitEffect = createBulletImpact(
                this.scene,
                hitPosition,
                bullet.direction.clone().negate()
              );
              this.effects.push(hitEffect);
              
              // If target is local player, update health
              if (target.id === this.socket.id && this.localPlayer) {
                this.localPlayer.takeDamage(damage);
                
                // Show hit marker for player who got the hit
                if (bullet.owner !== this.socket.id && this.players[bullet.owner]) {
                  this.players[bullet.owner].showHitMarker();
                }
              }
              
              // Add kill feed message if target died
              if (target.health <= 0) {
                const shooterName = bullet.owner === this.socket.id ? 
                  this.localPlayer.name : 
                  (this.players[bullet.owner] ? this.players[bullet.owner].name : "Bot");
                
                this.addKillFeedMessage(`${shooterName} killed ${target.name}`, shooterTeam);
                
                // Update shooter stats
                if (bullet.owner === this.socket.id) {
                  this.localPlayer.kills++;
                } else if (this.players[bullet.owner]) {
                  this.players[bullet.owner].kills++;
                }
              }
              
              break;
            }
          }
        }
        
        // Remove bullet if there was a collision
        if (collision) {
          bullet.remove();
          this.bullets.splice(i, 1);
        }
      animate(); {
      requestAnimationFrame(this.animate);
      
      const deltaTime = Math.min(this.clock.getDelta(), 0.1);
      this.update(deltaTime);
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    }
  }
    
    initEventListeners() ;{
      // Keyboard events
      document.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('keyup', this.onKeyUp);
      
      // Mouse events
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
    }
    
    onKeyDown(event) ;{
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
    
    onKeyUp(event) ;{
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
    
    onMouseMove(event); {
      if (!this.gameRunning || !this.controls.isLocked) return;
      
      // Update mouse position for raycasting
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    onMouseDown(event); {
      if (!this.gameRunning || !this.controls.isLocked) return;
      
      // Left mouse button (shoot)
      if (event.button === 0) {
        this.shooting = true;
        this.shoot();
      }
    }
    
    onMouseUp(event); {
      if (!this.gameRunning) return;
      
      // Left mouse button
      if (event.button === 0) {
        this.shooting = false;
      }
    }
    
    connect(); {
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
    
    joinGame() ;{
      // Send join request to server
      this.socket.emit('joinGame', {
        name: this.playerName
      });
      
      // Start game
      this.gameRunning = true;
      this.controls.lock();
    }
    
    handleGameState(gameState); {
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
    
    spawnBots() ;{
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
            position: team === 't' ? 
              {x: -15 + Math.random() * 5, y: 0, z: Math.random() * 10 - 5} : 
              {x: 15 - Math.random() * 5, y: 0, z: Math.random() * 10 - 5},
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
          
          // Make bots move and shoot
          this.startBotBehavior(botId);
        }
      }
    }
    
    startBotBehavior(botId) ;{
      const bot = this.players[botId];
      if (!bot) return;
      
      // Bot state
      const botState = {
        movementTarget: null,
        movementSpeed: 1 + Math.random() * 1.5, // Random speed between 1 and 2.5
        rotationTarget: bot.model.rotation.y,
        lastRotationChange: Date.now(),
        nextRotationChange: 2000 + Math.random() * 3000, // 2-5 seconds
        lastShot: 0,
        shootCooldown: 1000 + Math.random() * 2000 // 1-3 seconds
      };
      
      // Define spawn area boundaries based on team
      const boundaries = bot.team === 't' ? 
        { minX: -23, maxX: -8, minZ: -23, maxZ: 23 } : 
        { minX: 8, maxX: 23, minZ: -23, maxZ: 23 };
      
      // Set up movement interval
      const moveInterval = setInterval(() => {
        if (!this.gameRunning || !bot || !bot.alive) {
          clearInterval(moveInterval);
          return;
        }
        
        // Fix Y position to ensure bots are on the ground
        if (bot.model.position.y !== 0) {
          bot.model.position.y = 0;
        }
        
        // Generate new target if we don't have one or we're close to current target
        if (!botState.movementTarget || 
            new THREE.Vector2(bot.model.position.x, bot.model.position.z)
              .distanceTo(new THREE.Vector2(botState.movementTarget.x, botState.movementTarget.z)) < 0.5) {
          
          // Choose new target within team boundaries
          botState.movementTarget = {
            x: boundaries.minX + Math.random() * (boundaries.maxX - boundaries.minX),
            y: 0,
            z: boundaries.minZ + Math.random() * (boundaries.maxZ - boundaries.minZ)
          };
          
          // Face movement direction
          const moveDirection = new THREE.Vector2(
            botState.movementTarget.x - bot.model.position.x,
            botState.movementTarget.z - bot.model.position.z
          );
          
          if (moveDirection.length() > 0) {
            botState.rotationTarget = Math.atan2(moveDirection.x, moveDirection.y);
          }
        }
        
        // Smooth rotation to target
        const currentRotation = bot.model.rotation.y;
        const rotationDiff = botState.rotationTarget - currentRotation;
        
        // Handle angle wrapping
        let shortestRotation = rotationDiff;
        if (rotationDiff > Math.PI) shortestRotation = rotationDiff - 2 * Math.PI;
        if (rotationDiff < -Math.PI) shortestRotation = rotationDiff + 2 * Math.PI;
        
        // Apply smooth rotation
        bot.model.rotation.y += shortestRotation * 0.1;
        
        // Move toward target
        if (botState.movementTarget) {
          const direction = new THREE.Vector3(
            botState.movementTarget.x - bot.model.position.x,
            0,
            botState.movementTarget.z - bot.model.position.z
          ).normalize();
          
          // Apply movement at bot's speed
          const moveAmount = botState.movementSpeed * 0.05; // Adjust for frame rate
          bot.model.position.x += direction.x * moveAmount;
          bot.model.position.z += direction.z * moveAmount;
          
          // Keep within boundaries
          bot.model.position.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, bot.model.position.x));
          bot.model.position.z = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, bot.model.position.z));
        }
        
        // Random rotation changes
        const now = Date.now();
        if (now - botState.lastRotationChange > botState.nextRotationChange) {
          botState.rotationTarget = Math.random() * Math.PI * 2; // Random direction
          botState.lastRotationChange = now;
          botState.nextRotationChange = 2000 + Math.random() * 3000; // 2-5 seconds
        }
        
        // Check for enemies in line of sight
        if (now - botState.lastShot > botState.shootCooldown) {
          // Find potential targets (players on opposite team)
          const targets = Object.values(this.players).filter(player => 
            player.team !== bot.team && player.alive && player.id !== botId
          );
          
          if (targets.length > 0) {
            // Choose random target or nearest
            const target = targets[Math.floor(Math.random() * targets.length)];
            
            // Calculate direction to target
            const toTarget = new THREE.Vector3();
            toTarget.subVectors(target.model.position, bot.model.position);
            toTarget.y = 0; // Keep on horizontal plane
            
            // Check if target is in front of bot (within field of view)
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(bot.model.quaternion);
            const angleToTarget = forward.angleTo(toTarget);
            
            // If target is in front (within 60 degrees) and not too far
            if (angleToTarget < Math.PI/3 && toTarget.length() < 30) {
              // Turn to face target
              bot.model.lookAt(
                bot.model.position.x + toTarget.x,
                bot.model.position.y,
                bot.model.position.z + toTarget.z
              );
              
              // Shoot at target
              const direction = toTarget.normalize();
              
              // Create bullet
              const bullet = new Bullet(
                this.scene,
                new THREE.Vector3(
                  bot.model.position.x,
                  bot.model.position.y + 1.1, // Bullet comes from gun height
                  bot.model.position.z
                ),
                direction,
                300, // Same speed as player bullets
                botId
              );
              
              this.bullets.push(bullet);
              
              // Show muzzle flash
              const muzzleFlashEffect = createMuzzleFlash(
                this.scene, 
                new THREE.Vector3(
                  bot.model.position.x + direction.x * 0.5,
                  bot.model.position.y + 1.1,
                  bot.model.position.z + direction.z * 0.5
                ), 
                direction
              );
              this.effects.push(muzzleFlashEffect);
              
              // Reset shot cooldown
              botState.lastShot = now;
              botState.shootCooldown = 500 + Math.random() * 1500; // 0.5-2 seconds
              
              // Check if shot hits target
              const raycaster = new THREE.Raycaster(
                new THREE.Vector3(
                  bot.model.position.x,
                  bot.model.position.y + 1.1,
                  bot.model.position.z
                ),
                direction
              );
              
              // Add slight inaccuracy
              const inaccuracy = 0.1;
              raycaster.ray.direction.x += (Math.random() - 0.5) * inaccuracy;
              raycaster.ray.direction.y += (Math.random() - 0.5) * inaccuracy;
              raycaster.ray.direction.z += (Math.random() - 0.5) * inaccuracy;
              raycaster.ray.direction.normalize();
              
              // Check for hits on players
              const playerMeshes = Object.values(this.players)
                .filter(p => p.alive && p.id !== botId)
                .map(p => p.model);
              
              if (playerMeshes.length > 0) {
                const intersects = raycaster.intersectObjects(playerMeshes, true);
                
                if (intersects.length > 0) {
                  // Find which player was hit
                  const hitPlayerObj = intersects[0].object;
                  let hitPlayerId = null;
                  
                  // Find the player that owns the hit object
                  for (const pid in this.players) {
                    const p = this.players[pid];
                    if (p.model === hitPlayerObj || p.model.children.includes(hitPlayerObj)) {
                      hitPlayerId = pid;
                      break;
                    }
                  }
                  
                  if (hitPlayerId) {
                    // Apply damage (same as player shots)
                    if (this.players[hitPlayerId]) {
                      this.players[hitPlayerId].takeDamage(25);
                      
                      // If hit player is local player
                      if (hitPlayerId === this.socket.id && this.localPlayer) {
                        this.localPlayer.takeDamage(25);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }, 50); // Run at 20fps for smoother movement
    }
    
    addPlayer(playerData) ;{
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
    
    updatePlayerPosition(moveData) ;{
      const player = this.players[moveData.id];
      if (player) {
        player.update({
          position: moveData.position,
          rotation: moveData.rotation
        });
      }
    }
    
    handlePlayerShot(shotData) ;{
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
          300, // Faster bullet speed (was 100)
          shotData.bullet.owner
        );
        
        this.bullets.push(bullet);
      }
    }
    
    handlePlayerHit(hitData) ;{
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
        // Show hit marker
        this.showHitMarker();
      }
    }
    
    handlePlayerReload(reloadData) ;{
      const player = this.players[reloadData.playerId];
      if (player) {
        player.reload();
      }
    }
    
    removePlayer(playerId) ;{
      if (this.players[playerId]) {
        // Remove player model
        this.players[playerId].remove();
        
        // Remove player from list
        delete this.players[playerId];
      }
    }
    
    handleGameStart(gameData) ;{
      // Update UI
      this.updateRoundDisplay(gameData.round, gameData.maxRounds);
      
      // Reset scores
      this.updateScoreDisplay(0, 0);
      
      // Show game start message
      this.showMessage('Game Started!', 3000);
    }
    
    handleRoundStart(roundData); {
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
    
    handleRoundEnd(roundData); {
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
    
    handleGameEnd(gameData) ;{
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
    
    updateTimeDisplay(timeRemaining); {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      document.querySelector('.time-value').textContent = timeString;
    }
    
    updateScoreDisplay(tScore, ctScore) ;{
      document.querySelector('.t-score').textContent = tScore;
      document.querySelector('.ct-score').textContent = ctScore;
    }
    
    updateRoundDisplay(currentRound, maxRounds); {
      document.querySelector('.round-value').textContent = `${currentRound}/${maxRounds}`;
    }
    
    handleDisconnect() ;{
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
    
    applyViewShake(amount) ;{
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
        try {
          gsap.to(this.camera.rotation, {
            x: originalRotation,
            y: this.camera.rotation.y - horizontalShake,
            duration: 0.1
          });
        } catch (e) {
          // Fallback if GSAP isn't available
          this.camera.rotation.x = originalRotation;
          this.camera.rotation.y -= horizontalShake;
        }
      }, 50);
    }
    
    showHitMarker() ;{
      // Create hit marker element
      const hitMarker = document.createElement('div');
      hitMarker.className = 'hit-marker';
      hitMarker.innerHTML = '✕';
      document.getElementById('game-ui').appendChild(hitMarker);
      
      // Remove after a short time
      setTimeout(() => {
        if (document.getElementById('game-ui').contains(hitMarker)) {
          document.getElementById('game-ui').removeChild(hitMarker);
        }
      }, 100);
    }
    
    showMessage(message, duration); {
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
    
    showLoadingScreen() ;{
      document.getElementById('loading-screen').style.display = 'flex';
    }
    
    hideLoadingScreen(); {
      document.getElementById('loading-screen').style.display = 'none';
    }
    
    showLoginScreen(); {
      document.getElementById('login-screen').style.display = 'flex';
    }
    
    onWindowResize() ;{
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update(deltaTime) ;{
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
    }
}
}