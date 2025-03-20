class Weapon {
    constructor(type) {
      this.type = type;
      this.setProperties();
    }
    
    setProperties() {
      // Default weapon properties
      this.damage = 10;
      this.fireRate = 1; // Shots per second
      this.reloadTime = 2; // Seconds
      this.ammoCapacity = 10;
      this.range = 50;
      this.recoil = 0.01;
      this.accuracy = 0.9; // 1 = perfect accuracy
      this.automatic = false;
      this.model = null;
      this.muzzleFlash = null;
      
      // Set properties based on weapon type
      switch(this.type) {
        case 'rifle':
          this.damage = 25;
          this.fireRate = 5; // Increased from 2 to 5 shots per second
          this.reloadTime = 2.5;
          this.ammoCapacity = 30;
          this.range = 100;
          this.recoil = 0.05;
          this.accuracy = 0.85;
          this.automatic = true;
          break;
          
        case 'sniper':
          this.damage = 100;
          this.fireRate = 1;
          this.reloadTime = 3;
          this.ammoCapacity = 5;
          this.range = 200;
          this.recoil = 0.1;
          this.accuracy = 0.98;
          this.automatic = false;
          break;
          
        case 'smg':
          this.damage = 15;
          this.fireRate = 8; // Increased from 4 to 8
          this.reloadTime = 2;
          this.ammoCapacity = 25;
          this.range = 50;
          this.recoil = 0.03;
          this.accuracy = 0.8;
          this.automatic = true;
          break;
          
        case 'pistol':
          this.damage = 20;
          this.fireRate = 3; // Increased from 2 to 3
          this.reloadTime = 1.5;
          this.ammoCapacity = 12;
          this.range = 30;
          this.recoil = 0.03;
          this.accuracy = 0.85;
          this.automatic = false;
          break;
      }
    }
    
    createModel(scene) {
      // Create weapon model based on type
      let geometry, material;
      
      switch(this.type) {
        case 'rifle':
          // Main body
          geometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
          material = new THREE.MeshLambertMaterial({ color: 0x222222 });
          this.model = new THREE.Mesh(geometry, material);
          
          // Stock
          const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.2);
          const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
          const stock = new THREE.Mesh(stockGeometry, stockMaterial);
          stock.position.z = -0.3;
          this.model.add(stock);
          
          // Magazine
          const magGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
          const magMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
          const magazine = new THREE.Mesh(magGeometry, magMaterial);
          magazine.position.y = -0.15;
          this.model.add(magazine);
          
          // Scope
          const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
          const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
          const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
          scope.position.y = 0.08;
          scope.position.z = 0.1;
          scope.rotation.x = Math.PI / 2;
          this.model.add(scope);
          break;
          
        case 'sniper':
          // Main body
          geometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
          material = new THREE.MeshLambertMaterial({ color: 0x222222 });
          this.model = new THREE.Mesh(geometry, material);
          
          // Stock
          const sniperStockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.3);
          const sniperStockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
          const sniperStock = new THREE.Mesh(sniperStockGeometry, sniperStockMaterial);
          sniperStock.position.z = -0.4;
          this.model.add(sniperStock);
          
          // Scope
          const sniperScopeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
          const sniperScopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
          const sniperScope = new THREE.Mesh(sniperScopeGeometry, sniperScopeMaterial);
          sniperScope.position.y = 0.12;
          sniperScope.position.z = 0.1;
          sniperScope.rotation.x = Math.PI / 2;
          this.model.add(sniperScope);
          
          // Barrel
          const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
          const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
          const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
          barrel.position.z = 0.5;
          barrel.rotation.x = Math.PI / 2;
          this.model.add(barrel);
          break;
          
        case 'smg':
          // Main body
          geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
          material = new THREE.MeshLambertMaterial({ color: 0x333333 });
          this.model = new THREE.Mesh(geometry, material);
          
          // Handle
          const handleGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.1);
          const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
          const handle = new THREE.Mesh(handleGeometry, handleMaterial);
          handle.position.y = -0.12;
          handle.position.z = -0.15;
          this.model.add(handle);
          
          // Magazine
          const smgMagGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.08);
          const smgMagMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
          const smgMagazine = new THREE.Mesh(smgMagGeometry, smgMagMaterial);
          smgMagazine.position.y = -0.17;
          this.model.add(smgMagazine);
          break;
          
        case 'pistol':
          // Main body
          geometry = new THREE.BoxGeometry(0.08, 0.12, 0.25);
          material = new THREE.MeshLambertMaterial({ color: 0x111111 });
          this.model = new THREE.Mesh(geometry, material);
          
          // Handle
          const pistolHandleGeometry = new THREE.BoxGeometry(0.07, 0.15, 0.1);
          const pistolHandleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
          const pistolHandle = new THREE.Mesh(pistolHandleGeometry, pistolHandleMaterial);
          pistolHandle.position.y = -0.13;
          pistolHandle.position.z = -0.07;
          this.model.add(pistolHandle);
          break;
      }
      
      // Create muzzle flash (hidden by default)
      const flashGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
      const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
      this.muzzleFlash.position.z = 0.4;
      this.muzzleFlash.rotation.x = Math.PI / 2;
      this.muzzleFlash.visible = false;
      this.model.add(this.muzzleFlash);
      
      // Add to scene
      if (scene) {
        scene.add(this.model);
      }
      
      return this.model;
    }
    
    showMuzzleFlash() {
      if (this.muzzleFlash) {
        // Show muzzle flash
        this.muzzleFlash.visible = true;
        
        // Hide after a short time
        setTimeout(() => {
          this.muzzleFlash.visible = false;
        }, 50);
      }
    }
    
    fire() {
      // Show muzzle flash
      this.showMuzzleFlash();
      
      // Generate recoil effect
      const recoilAmount = this.recoil;
      
      // Apply accuracy deviation
      const accuracy = this.accuracy;
      const deviation = (1 - accuracy) * 0.1;
      const spreadX = (Math.random() - 0.5) * 2 * deviation;
      const spreadY = (Math.random() - 0.5) * 2 * deviation;
      
      return {
        recoil: recoilAmount,
        spread: { x: spreadX, y: spreadY }
      };
    }
    
    getAudioFile() {
      // Return audio file for weapon sound
      switch(this.type) {
        case 'rifle':
          return 'sounds/rifle_shot.mp3';
        case 'sniper':
          return 'sounds/sniper_shot.mp3';
        case 'smg':
          return 'sounds/smg_shot.mp3';
        case 'pistol':
          return 'sounds/pistol_shot.mp3';
        default:
          return 'sounds/default_shot.mp3';
      }
    }
  }
  
  // Factory function to create weapons
  function createWeapon(type, scene) {
    const weapon = new Weapon(type);
    if (scene) {
      weapon.createModel(scene);
    }
    return weapon;
  }
  
  // Bullet class for projectile visualization
  class Bullet {
    constructor(scene, origin, direction, speed, owner) {
      this.scene = scene;
      this.origin = origin;
      this.direction = direction;
      this.speed = speed || 300; // Increased from 100 to 300
      this.owner = owner;
      this.traveled = 0;
      this.maxDistance = 200;
      this.active = true;
      
      // Create bullet mesh
      this.createMesh();
    }
    
    createMesh() {
      // More visible bullet
      const geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      this.mesh = new THREE.Mesh(geometry, material);
      
      // Set initial position
      this.mesh.position.copy(this.origin);
      
      // Rotate to match direction
      this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.direction.normalize());
      
      // Add to scene
      this.scene.add(this.mesh);
      
      // Add particle trail
      this.createTrail();
    }
    
    createTrail() {
      // Create better particle trail
      const particleCount = 10; // Increased from 5 to 10
      this.particles = [];
      this.trail = new THREE.Group();
      
      for (let i = 0; i < particleCount; i++) {
        const size = 0.03 * (particleCount - i) / particleCount;
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(size, 8, 8),
          new THREE.MeshBasicMaterial({ 
            color: 0xff9900,
            transparent: true,
            opacity: 0.7 * (particleCount - i) / particleCount
          })
        );
        
        // Store original position
        particle.userData.offset = i * -0.15; // Spacing between particles
        
        this.particles.push(particle);
        this.trail.add(particle);
      }
      
      this.scene.add(this.trail);
      
      // Initial positions
      this.updateTrailPositions();
    }
    
    updateTrailPositions() {
      // Place particles along bullet path
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        const offset = particle.userData.offset;
        
        // Create position by going backward from bullet position along direction
        const position = this.mesh.position.clone().add(
          this.direction.clone().multiplyScalar(offset)
        );
        
        particle.position.copy(position);
      }
    }
    
    update(deltaTime) {
      if (!this.active) return false;
      
      // Calculate movement
      const distance = this.speed * deltaTime;
      this.traveled += distance;
      
      // Move bullet
      const movement = this.direction.clone().multiplyScalar(distance);
      this.mesh.position.add(movement);
      
      // Update trail positions
      this.updateTrailPositions();
      
      // Check if bullet has traveled max distance
      if (this.traveled >= this.maxDistance) {
        this.remove();
        return false;
      }
      
      return true;
    }
    
    remove() {
      this.active = false;
      
      // Remove from scene
      if (this.mesh) {
        this.scene.remove(this.mesh);
      }
      
      if (this.trail) {
        this.scene.remove(this.trail);
      }
    }
  }