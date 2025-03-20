class Player {
    constructor(game, id, data) {
      this.game = game;
      this.id = id;
      this.name = data.name;
      this.team = data.team;
      this.health = data.health || 100;
      this.ammo = data.ammo || 30;
      this.kills = data.kills || 0;
      this.deaths = data.deaths || 0;
      this.alive = data.alive !== undefined ? data.alive : true;
      this.isLocal = false;
      this.isBot = data.isBot || false;
      
      // Create 3D model
      this.createModel(data.position, data.rotation);
    }
    
    createModel(position, rotation) {
      // Create player model based on team
      const modelColor = this.team === 't' ? 0xff9900 : 0x00ccff;
      
      // Head
      const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf1c27d }); // Skin color
      this.head = new THREE.Mesh(headGeometry, headMaterial);
      this.head.position.y = 1.6;
      this.head.castShadow = true;
      
      // Body
      const bodyGeometry = new THREE.BoxGeometry(0.6, 0.9, 0.3);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: modelColor });
      this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      this.body.position.y = 1.0;
      this.body.castShadow = true;
      
      // Arms
      const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
      const armMaterial = new THREE.MeshLambertMaterial({ color: modelColor });
      
      // Left arm
      this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
      this.leftArm.position.set(-0.4, 1.0, 0);
      this.leftArm.castShadow = true;
      
      // Right arm
      this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
      this.rightArm.position.set(0.4, 1.0, 0);
      this.rightArm.castShadow = true;
      
      // Legs
      const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark pants
      
      // Left leg
      this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      this.leftLeg.position.set(-0.2, 0.4, 0);
      this.leftLeg.castShadow = true;
      
      // Right leg
      this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      this.rightLeg.position.set(0.2, 0.4, 0);
      this.rightLeg.castShadow = true;
      
      // Gun
      const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
      const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
      this.gun = new THREE.Mesh(gunGeometry, gunMaterial);
      this.gun.position.set(0.3, 1.1, 0.4);
      this.gun.castShadow = true;
      
      // Create player group to hold all parts
      this.model = new THREE.Group();
      this.model.add(this.head);
      this.model.add(this.body);
      this.model.add(this.leftArm);
      this.model.add(this.rightArm);
      this.model.add(this.leftLeg);
      this.model.add(this.rightLeg);
      this.model.add(this.gun);
      
      // Set position and rotation
      if (position) {
        this.model.position.copy(position);
      }
      
      if (rotation) {
        this.model.rotation.copy(rotation);
      }
      
      // Add name label
      this.createNameLabel();
      
      // Add to scene
      this.game.scene.add(this.model);
    }
    
    createNameLabel() {
      // Create canvas for the name
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      // Draw background
      context.fillStyle = this.team === 't' ? 'rgba(255, 153, 0, 0.8)' : 'rgba(0, 204, 255, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw border
      context.strokeStyle = 'white';
      context.lineWidth = 3;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      // Draw text
      context.font = 'bold 24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      context.fillText(this.name, canvas.width / 2, canvas.height / 2);
      
      // Create texture and sprite
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      this.nameSprite = new THREE.Sprite(material);
      this.nameSprite.scale.set(2, 0.5, 1);
      this.nameSprite.position.y = 2.2; // Position above head
      
      // Add to model
      this.model.add(this.nameSprite);
    }
    
    update(data) {
      // Update player data
      if (data.health !== undefined) this.health = data.health;
      if (data.ammo !== undefined) this.ammo = data.ammo;
      if (data.kills !== undefined) this.kills = data.kills;
      if (data.deaths !== undefined) this.deaths = data.deaths;
      if (data.alive !== undefined) this.alive = data.alive;
      
      // Update position and rotation if provided
      if (data.position) {
        this.model.position.copy(data.position);
      }
      
      if (data.rotation) {
        this.model.rotation.copy(data.rotation);
      }
      
      // Update visibility based on alive status
      this.model.visible = this.alive;
    }
    
    setAsLocalPlayer() {
      this.isLocal = true;
      
      // Hide model for first-person view
      this.model.visible = false;
      
      // Hide name label for local player
      if (this.nameSprite) {
        this.nameSprite.visible = false;
      }
    }
    
    shoot() {
      // Shooting animation
      if (this.ammo > 0) {
        this.ammo--;
        
        // Recoil animation - use try/catch in case GSAP is not available
        try {
          gsap.to(this.gun.position, {
            z: 0.2,
            duration: 0.05,
            yoyo: true,
            repeat: 1
          });
        } catch (e) {
          // Fall back to simple animation if GSAP is not available
          const originalPosition = this.gun.position.z;
          this.gun.position.z = 0.2;
          setTimeout(() => {
            this.gun.position.z = originalPosition;
          }, 50);
        }
        
        // Update UI
        if (this.isLocal) {
          document.querySelector('.ammo-value').textContent = this.ammo;
        }
        
        return true;
      }
      
      return false;
    }
    
    reload() {
      // Reload animation and logic
      try {
        gsap.to(this.gun.rotation, {
          x: Math.PI * 2,
          duration: 1,
          onComplete: () => {
            this.ammo = 30; // Full ammo
            
            // Update UI if local player
            if (this.isLocal) {
              document.querySelector('.ammo-value').textContent = this.ammo;
            }
          }
        });
      } catch (e) {
        // Fall back to simple animation if GSAP is not available
        const originalRotation = this.gun.rotation.x;
        this.gun.rotation.x = Math.PI * 2;
        setTimeout(() => {
          this.gun.rotation.x = originalRotation;
          this.ammo = 30; // Full ammo
          
          // Update UI if local player
          if (this.isLocal) {
            document.querySelector('.ammo-value').textContent = this.ammo;
          }
        }, 1000);
      }
    }
    
    takeDamage(amount) {
      this.health -= amount;
      
      // Update UI if local player
      if (this.isLocal) {
        document.querySelector('.health-value').textContent = this.health;
        document.querySelector('.health-bar-inner').style.width = `${this.health}%`;
        
        // Change color based on health
        if (this.health < 30) {
          document.querySelector('.health-bar-inner').style.backgroundColor = '#cc0000';
        } else if (this.health < 70) {
          document.querySelector('.health-bar-inner').style.backgroundColor = '#ff9900';
        }
        
        // Screen flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.zIndex = '9';
        document.body.appendChild(flashOverlay);
        
        // Remove flash after a short time
        setTimeout(() => {
          document.body.removeChild(flashOverlay);
        }, 200);
      } else if (this.isBot) {
        // Bot visual feedback - red flash
        const originalMaterials = [];
        
        // Store original materials and change to red
        this.model.traverse(child => {
          if (child.isMesh && child.material) {
            originalMaterials.push({
              mesh: child,
              material: child.material
            });
            
            child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          }
        });
        
        // Reset materials after short delay
        setTimeout(() => {
          originalMaterials.forEach(item => {
            item.mesh.material = item.material;
          });
        }, 100);
      }
      
      // Check if dead
      if (this.health <= 0) {
        this.die();
      }
    }
    
    die() {
      this.alive = false;
      this.health = 0;
      this.deaths++;
      
      // Hide model
      this.model.visible = false;
      
      // Create death effect
      const deathEffect = createDeathEffect(
        this.game.scene,
        this.model.position.clone(),
        this.team
      );
      
      this.game.effects.push(deathEffect);
      
      // Update UI if local player
      if (this.isLocal) {
        document.querySelector('.health-value').textContent = '0';
        document.querySelector('.health-bar-inner').style.width = '0%';
      }
      
      // Respawn bots after a delay
      if (this.isBot) {
        setTimeout(() => {
          if (this.game.gameRunning) {
            this.respawn();
          }
        }, 5000); // 5 second respawn time for bots
      }
    }
    
    respawn(position) {
      this.alive = true;
      this.health = 100;
      this.ammo = 30;
      
      // Position player
      if (position) {
        this.model.position.copy(position);
      } else {
        // Default spawn based on team
        const spawnX = this.team === 't' ? -20 : 20;
        this.model.position.set(spawnX, 0, 0); // Fixed Y position to 0 for bots
      }
      
      // Show model (unless local player)
      this.model.visible = !this.isLocal;
      
      // Update UI if local player
      if (this.isLocal) {
        document.querySelector('.health-value').textContent = '100';
        document.querySelector('.health-bar-inner').style.width = '100%';
        document.querySelector('.health-bar-inner').style.backgroundColor = '#00cc00';
        document.querySelector('.ammo-value').textContent = '30';
      }
    }
    
    remove() {
      // Remove model from scene
      this.game.scene.remove(this.model);
    }
  }