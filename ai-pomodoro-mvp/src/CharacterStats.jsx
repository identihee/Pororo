// src/CharacterStats.jsx

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const CharacterStats = ({ totalFocusTime, canvasHeight = 350, showDetails = true }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // === Three.js Setup ===
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45, 
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 9); 
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    currentMount.innerHTML = ''; 
    currentMount.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // === Procedural "Animal Crossing" Style Scene ===
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // 1. Ground (Round Grass Platform)
    const groundGeo = new THREE.CylinderGeometry(7, 7, 1, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x95e06c }); // AC Grass Green
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -2.5;
    islandGroup.add(ground);

    // 2. Trees (Simple Low Poly)
    const createTree = (x, z, scale = 1) => {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 1.5 * scale, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.75 * scale;
        treeGroup.add(trunk);

        // Leaves (3 layers of cones)
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
        
        const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.2 * scale, 1.5 * scale, 8), leavesMat);
        l1.position.y = 1.5 * scale;
        treeGroup.add(l1);

        const l2 = new THREE.Mesh(new THREE.ConeGeometry(1.0 * scale, 1.5 * scale, 8), leavesMat);
        l2.position.y = 2.2 * scale;
        treeGroup.add(l2);

        treeGroup.position.set(x, -2, z);
        return treeGroup;
    };

    islandGroup.add(createTree(-3.5, -2, 1.2));
    islandGroup.add(createTree(3.5, -1, 1.1));
    islandGroup.add(createTree(-2, -4, 0.9));
    islandGroup.add(createTree(2.5, -3.5, 1.0));

    // 3. Character (Cute Round Animal - Bear/Cat Hybrid)
    const charGroup = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffe0bd }); // Light skin
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b }); // Red shirt
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x5c6bc0 }); // Blue pants
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x333333 }); // Eyes
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xffa0a0, transparent: true, opacity: 0.6 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), skinMat);
    head.position.y = 0.2;
    charGroup.add(head);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.6, 0.8, 0);
    charGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.6, 0.8, 0);
    charGroup.add(rightEar);

    // Face
    const eyeGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, blackMat);
    leftEye.position.set(-0.25, 0.3, 0.7);
    charGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, blackMat);
    rightEye.position.set(0.25, 0.3, 0.7);
    charGroup.add(rightEye);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), blackMat);
    nose.position.set(0, 0.15, 0.75);
    charGroup.add(nose);

    const blushGeo = new THREE.CircleGeometry(0.15, 16);
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.5, 0.1, 0.65);
    leftBlush.rotation.y = -0.3;
    charGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.5, 0.1, 0.65);
    rightBlush.rotation.y = 0.3;
    charGroup.add(rightBlush);

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.0, 16), shirtMat);
    body.position.y = -0.8;
    charGroup.add(body);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.6, -0.6, 0);
    leftArm.rotation.z = 0.5;
    charGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.6, -0.6, 0);
    rightArm.rotation.z = -0.5;
    charGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.6, 4, 8);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.25, -1.4, 0);
    charGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.25, -1.4, 0);
    charGroup.add(rightLeg);

    charGroup.position.y = -0.5;
    islandGroup.add(charGroup);

    setLoading(false);

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.002;
      
      // Idle Animation
      if (charGroup) {
        charGroup.position.y = -0.5 + Math.sin(time * 2) * 0.05; // Bobbing
        charGroup.rotation.y = Math.sin(time) * 0.1; // Slight turn
        
        // Arms swinging
        leftArm.rotation.x = Math.sin(time * 2) * 0.2;
        rightArm.rotation.x = -Math.sin(time * 2) * 0.2;
      }

      // Island slow rotation
      islandGroup.rotation.y = Math.sin(time * 0.2) * 0.05;

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

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(currentMount);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [canvasHeight]);

  // totalFocusTime은 App.jsx에서 받은 총 집중 시간 (분)
  const hours = Math.floor(totalFocusTime / 60);
  const minutes = totalFocusTime % 60;
  const fruitCount = Math.floor(totalFocusTime / 30); 

  return (
    <div style={{ 
      padding: showDetails ? '20px' : '10px',
      backgroundColor: 'transparent',
      borderRadius: '15px', 
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: showDetails ? 'space-between' : 'center',
    }}>
      {showDetails && <h2>✨ 나의 섬 생활</h2>}
      
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: `${canvasHeight}px`, 
        margin: showDetails ? '10px 0' : '0',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%)', // Sky Blue Gradient
        overflow: 'hidden'
      }}>
        <div 
          ref={mountRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }} 
        />
        
        {loading && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#555',
            fontWeight: 'bold'
          }}>
            Loading Island...
          </div>
        )}
      </div>

      {showDetails && (
        <>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#6a1b9a' }}>
            오늘 총 집중 시간: **{hours}시간 {minutes}분**
          </p>
          <p style={{ fontSize: '1em', color: '#888' }}>
            열매 🍎 **{fruitCount}개** 획득! 🌳
          </p>
        </>
      )}
    </div>
  );
};

export default CharacterStats;