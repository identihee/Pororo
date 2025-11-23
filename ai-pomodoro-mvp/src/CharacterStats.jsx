// src/CharacterStats.jsx

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const CharacterStats = ({ totalFocusTime, canvasHeight = 350, showDetails = true }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // === 1. Initialize Dimensions ===
    // Force a minimum size if clientWidth is 0 (e.g. hidden or not laid out yet)
    const width = container.clientWidth || 300;
    const height = container.clientHeight || canvasHeight;

    // === 2. Scene Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky Blue Background

    // === 3. Camera Setup ===
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, 0);

    // === 4. Renderer Setup ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Clear any existing canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // === 5. Lighting ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // === 6. Procedural Content (Animal Crossing Style) ===
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 1, 32),
      new THREE.MeshLambertMaterial({ color: 0x95e06c })
    );
    ground.position.y = -2;
    islandGroup.add(ground);

    // Character Group
    const charGroup = new THREE.Group();
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0xffe0bd })
    );
    head.position.y = 0.5;
    charGroup.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.6, 0.7);
    charGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.6, 0.7);
    charGroup.add(rightEye);

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 1.2, 16),
      new THREE.MeshLambertMaterial({ color: 0xff6b6b })
    );
    body.position.y = -0.6;
    charGroup.add(body);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.7, -0.4, 0);
    leftArm.rotation.z = 0.5;
    charGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.7, -0.4, 0);
    rightArm.rotation.z = -0.5;
    charGroup.add(rightArm);

    charGroup.position.y = -0.5;
    islandGroup.add(charGroup);

    // Trees
    const addTree = (x, z) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      );
      trunk.position.y = 0.75;
      tree.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0x4caf50 })
      );
      leaves.position.y = 2;
      tree.add(leaves);
      tree.position.set(x, -2, z);
      islandGroup.add(tree);
    };
    addTree(-3, -2);
    addTree(3, -1);

    // === 7. Animation Loop ===
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.002;
      
      // Character idle
      charGroup.position.y = -0.5 + Math.sin(time * 3) * 0.05;
      leftArm.rotation.x = Math.sin(time * 3) * 0.2;
      rightArm.rotation.x = -Math.sin(time * 3) * 0.2;

      // Island rotate
      islandGroup.rotation.y = Math.sin(time * 0.2) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // === 8. Resize Handler ===
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      // Optional: scene.clear() if needed
    };
  }, [canvasHeight]);

  const hours = Math.floor(totalFocusTime / 60);
  const minutes = totalFocusTime % 60;

  return (
    <div style={{ 
      padding: showDetails ? '20px' : '0px',
      borderRadius: '15px', 
      textAlign: 'center',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {showDetails && <h2>✨ 나의 섬 생활</h2>}
      
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: `${canvasHeight}px`, 
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#87CEEB', // Fallback background color (Sky Blue)
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div 
          ref={mountRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }} 
        />
      </div>

      {showDetails && (
        <div style={{ marginTop: 10 }}>
          <p>오늘 집중: {hours}시간 {minutes}분</p>
        </div>
      )}
    </div>
  );
};

export default CharacterStats;