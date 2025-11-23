// src/CharacterStats.jsx

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const CharacterStats = ({ totalFocusTime, canvasHeight = 350, showDetails = true }) => {
  const mountRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Debug: Check if mount has dimensions
    console.log("Mount dimensions:", currentMount.clientWidth, currentMount.clientHeight);

    // === Three.js Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Explicit Sky Blue Background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50, 
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 8); 
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear and append
    while (currentMount.firstChild) {
      currentMount.removeChild(currentMount.firstChild);
    }
    currentMount.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // === Simple Scene for Debugging/Stability ===
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // 1. Ground
    const groundGeo = new THREE.CylinderGeometry(6, 6, 0.5, 32);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x95e06c });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -2;
    islandGroup.add(ground);

    // 2. Simple Tree
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    trunk.position.set(-2, -1, 0);
    islandGroup.add(trunk);
    
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 2.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x4caf50 })
    );
    leaves.position.set(-2, 0.5, 0);
    islandGroup.add(leaves);

    // 3. Character (Simple Shapes)
    const charGroup = new THREE.Group();
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0xffe0bd })
    );
    head.position.y = 0.5;
    charGroup.add(head);

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 1.2, 16),
      new THREE.MeshLambertMaterial({ color: 0xff6b6b })
    );
    body.position.y = -0.6;
    charGroup.add(body);

    charGroup.position.set(0, -0.5, 1);
    islandGroup.add(charGroup);

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.002;
      charGroup.position.y = -0.5 + Math.sin(time * 3) * 0.1; // Bounce
      islandGroup.rotation.y = Math.sin(time * 0.5) * 0.1; // Rotate island

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [canvasHeight, isMounted]); // Re-run when mounted

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
          backgroundColor: '#87CEEB', // Fallback color
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