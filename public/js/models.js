// This file contains helper functions for creating character models

// Create a player model with the given team color
function createPlayerModel(team) {
    const color = team === 't' ? 0xff9900 : 0x00ccff;
    const group = new THREE.Group();
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf1c27d }); // Skin color
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.9, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({ color: color });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1.0, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1.0, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark pants
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Gun
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.3, 1.1, 0.4);
    gun.castShadow = true;
    group.add(gun);
    
    return {
      model: group,
      parts: {
        head,
        body,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        gun
      }
    };
  }
  
  // Create a death effect (particles) at the given position
  function createDeathEffect(scene, position, team) {
    const color = team === 't' ? 0xff9900 : 0x00ccff;
    const particleCount = 20;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 0.2 + 0.05;
      const particle = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ 
          color: color,
          transparent: true,
          opacity: 0.8
        })
      );
      
      // Random position around death point
      particle.position.set(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + (Math.random() - 0.5) * 0.5,
        position.z + (Math.random() - 0.5) * 0.5
      );
      
      // Random velocity
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 4,
        (Math.random() - 0.5) * 2
      );
      
      // Random rotation
      particle.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1
      };
      
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Return animation update function
    return function animateDeathEffect(deltaTime) {
      let active = false;
      
      particles.children.forEach(particle => {
        // Apply gravity
        particle.userData.velocity.y -= 9.8 * deltaTime;
        
        // Move particle
        particle.position.x += particle.userData.velocity.x * deltaTime;
        particle.position.y += particle.userData.velocity.y * deltaTime;
        particle.position.z += particle.userData.velocity.z * deltaTime;
        
        // Rotate particle
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;
        
        // Fade out
        if (particle.material.opacity > 0) {
          particle.material.opacity -= deltaTime * 0.5;
          active = true;
        }
        
        // Floor collision
        if (particle.position.y < 0) {
          particle.position.y = 0;
          particle.userData.velocity.y *= -0.4; // Bounce with damping
          particle.userData.velocity.x *= 0.8; // Friction
          particle.userData.velocity.z *= 0.8; // Friction
        }
      });
      
      // If no active particles, remove from scene
      if (!active) {
        scene.remove(particles);
        return false;
      }
      
      return true;
    };
  }
  
  // Create a bullet impact effect at the given position
  function createBulletImpact(scene, position, normal) {
    // Create impact mark (decal)
    const decalGeometry = new THREE.CircleGeometry(0.1, 8);
    const decalMaterial = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const decal = new THREE.Mesh(decalGeometry, decalMaterial);
    decal.position.copy(position);
    
    // Orient to surface normal
    if (normal) {
      decal.lookAt(position.clone().add(normal));
    } else {
      // Default orientation if no normal provided
      decal.lookAt(position.clone().add(new THREE.Vector3(0, 0, 1)));
    }
    
    // Slight offset to prevent z-fighting
    decal.position.add(normal ? normal.clone().multiplyScalar(0.01) : new THREE.Vector3(0, 0, 0.01));
    
    scene.add(decal);
    
    // Create spark particles
    const particleCount = 10;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffcc00,
          transparent: true,
          opacity: 1
        })
      );
      
      // Position at impact point
      particle.position.copy(position);
      
      // Random velocity - primarily away from surface
      let dir;
      if (normal) {
        dir = normal.clone();
        dir.x += (Math.random() - 0.5) * 0.5;
        dir.y += (Math.random() - 0.5) * 0.5;
        dir.z += (Math.random() - 0.5) * 0.5;
        dir.normalize();
      } else {
        dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          Math.random()
        );
      }
      
      particle.userData.velocity = dir.multiplyScalar(Math.random() * 2 + 1);
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Return animation update function
    return function animateBulletImpact(deltaTime) {
      let active = false;
      
      // Update particles
      particles.children.forEach(particle => {
        // Apply gravity
        particle.userData.velocity.y -= 9.8 * deltaTime;
        
        // Move particle
        particle.position.x += particle.userData.velocity.x * deltaTime;
        particle.position.y += particle.userData.velocity.y * deltaTime;
        particle.position.z += particle.userData.velocity.z * deltaTime;
        
        // Fade out
        if (particle.material.opacity > 0) {
          particle.material.opacity -= deltaTime * 2;
          particle.scale.multiplyScalar(0.95);
          active = true;
        }
      });
      
      // Fade out decal
      if (decal.material.opacity > 0) {
        decal.material.opacity -= deltaTime * 0.1;
        active = true;
      } else {
        scene.remove(decal);
      }
      
      // If no active elements, remove from scene
      if (!active) {
        scene.remove(particles);
        return false;
      }
      
      return true;
    };
  }
  
  // Create muzzle flash effect
  function createMuzzleFlash(scene, position, direction) {
    // Create flash light
    const light = new THREE.PointLight(0xffcc00, 1, 5);
    light.position.copy(position);
    scene.add(light);
    
    // Create flash mesh
    const flashGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    
    // Orient along firing direction
    if (direction) {
      flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }
    
    scene.add(flash);
    
    // Return animation update function
    return function animateMuzzleFlash(deltaTime) {
      // Fade out quickly
      flash.material.opacity -= deltaTime * 10;
      light.intensity -= deltaTime * 10;
      
      if (flash.material.opacity <= 0) {
        scene.remove(flash);
        scene.remove(light);
        return false;
      }
      
      return true;
    };
  }