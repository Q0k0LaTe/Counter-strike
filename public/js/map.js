class GameMap {
    constructor(scene) {
      this.scene = scene;
      this.objects = []; // Collidable objects
    }
  
    create() {
      this.createFloor();
      this.createWalls();
      this.createObstacles();
      this.createLighting();
      this.createSpawnPoints();
      return this.objects;
    }
  
    createFloor() {
      // Create floor
      const floorGeometry = new THREE.PlaneGeometry(50, 50);
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.2
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      this.scene.add(floor);
    }
  
    createWalls() {
      // Create outer walls
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.2
      });
  
      // North wall
      const northWallGeometry = new THREE.BoxGeometry(50, 5, 0.5);
      const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
      northWall.position.set(0, 2.5, -25);
      northWall.castShadow = true;
      northWall.receiveShadow = true;
      this.scene.add(northWall);
      this.objects.push(northWall);
  
      // South wall
      const southWall = northWall.clone();
      southWall.position.z = 25;
      this.scene.add(southWall);
      this.objects.push(southWall);
  
      // East wall
      const eastWallGeometry = new THREE.BoxGeometry(0.5, 5, 50);
      const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
      eastWall.position.set(25, 2.5, 0);
      eastWall.castShadow = true;
      eastWall.receiveShadow = true;
      this.scene.add(eastWall);
      this.objects.push(eastWall);
  
      // West wall
      const westWall = eastWall.clone();
      westWall.position.x = -25;
      this.scene.add(westWall);
      this.objects.push(westWall);
    }
  
    createObstacles() {
      // Create central building/structure
      this.createCentralStructure();
      
      // Create crates for cover
      this.createCrates();
    }
  
    createCentralStructure() {
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.6,
        metalness: 0.3
      });
  
      // Main structure
      const structureGeometry = new THREE.BoxGeometry(10, 4, 10);
      const structure = new THREE.Mesh(structureGeometry, buildingMaterial);
      structure.position.set(0, 2, 0);
      structure.castShadow = true;
      structure.receiveShadow = true;
      this.scene.add(structure);
      this.objects.push(structure);
  
      // Roof
      const roofGeometry = new THREE.BoxGeometry(12, 0.5, 12);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.5,
        metalness: 0.4
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(0, 4.25, 0);
      roof.castShadow = true;
      roof.receiveShadow = true;
      this.scene.add(roof);
  
      // Create openings in the structure (doors/windows)
      this.createOpenings(structure);
    }
  
    createOpenings(structure) {
      // North door
      const doorGeometry = new THREE.BoxGeometry(2, 3, 1);
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.9,
        metalness: 0.1
      });
      const northDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      northDoor.position.set(0, 1.5, -5);
      this.scene.add(northDoor);
  
      // South door
      const southDoor = northDoor.clone();
      southDoor.position.z = 5;
      this.scene.add(southDoor);
  
      // Windows
      const windowGeometry = new THREE.BoxGeometry(2, 1, 0.3);
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a7cca,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.6
      });
  
      // East window
      const eastWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      eastWindow.position.set(5, 2.5, 0);
      eastWindow.rotation.y = Math.PI / 2;
      this.scene.add(eastWindow);
  
      // West window
      const westWindow = eastWindow.clone();
      westWindow.position.x = -5;
      this.scene.add(westWindow);
    }
  
    createCrates() {
      const crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
      });
  
      // Create crates in strategic positions
      const cratePositions = [
        // T-side area
        { x: -15, y: 0.75, z: -10 },
        { x: -17, y: 0.75, z: -10 },
        { x: -15, y: 0.75, z: -8 },
        { x: -15, y: 2.25, z: -10 }, // Stacked crate
        
        // CT-side area
        { x: 15, y: 0.75, z: 10 },
        { x: 17, y: 0.75, z: 10 },
        { x: 15, y: 0.75, z: 8 },
        { x: 15, y: 2.25, z: 10 }, // Stacked crate
        
        // Mid area
        { x: -8, y: 0.75, z: 0 },
        { x: 8, y: 0.75, z: 0 },
        { x: 0, y: 0.75, z: -8 },
        { x: 0, y: 0.75, z: 8 }
      ];
  
      cratePositions.forEach(pos => {
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(pos.x, pos.y, pos.z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.scene.add(crate);
        this.objects.push(crate);
      });
    }
  
    createLighting() {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
  
      // Directional light (sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(20, 30, 20);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 100;
      directionalLight.shadow.camera.left = -30;
      directionalLight.shadow.camera.right = 30;
      directionalLight.shadow.camera.top = 30;
      directionalLight.shadow.camera.bottom = -30;
      this.scene.add(directionalLight);
  
      // Point lights inside the building
      const pointLight = new THREE.PointLight(0xffffcc, 1, 10);
      pointLight.position.set(0, 3, 0);
      pointLight.castShadow = true;
      this.scene.add(pointLight);
    }
  
    createSpawnPoints() {
      // T-side spawn area (visual indicators)
      const tSpawnGeometry = new THREE.CircleGeometry(1, 16);
      const tSpawnMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9900,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const tSpawn = new THREE.Mesh(tSpawnGeometry, tSpawnMaterial);
      tSpawn.rotation.x = -Math.PI / 2;
      tSpawn.position.set(-20, 0.01, 0);
      this.scene.add(tSpawn);
  
      // CT-side spawn area (visual indicators)
      const ctSpawnGeometry = new THREE.CircleGeometry(1, 16);
      const ctSpawnMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const ctSpawn = new THREE.Mesh(ctSpawnGeometry, ctSpawnMaterial);
      ctSpawn.rotation.x = -Math.PI / 2;
      ctSpawn.position.set(20, 0.01, 0);
      this.scene.add(ctSpawn);
    }
  }