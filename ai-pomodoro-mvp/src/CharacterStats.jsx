// src/CharacterStats.jsx

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const CharacterStats = ({ totalFocusTime, canvasHeight = 350, showDetails = true }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    camera.position.set(0, 2, 8); 

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Important for GLB colors
    
    currentMount.innerHTML = ''; 
    currentMount.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Load Models
    const loader = new GLTFLoader();
    const group = new THREE.Group();
    scene.add(group);

    let mixer = null;
    const clock = new THREE.Clock();

    const loadModels = async () => {
      try {
        // 1. Load Background (Autumn Scene)
        // Note: Ensure the file is in the public folder
        try {
          const bgGltf = await loader.loadAsync('/Autumn_Serenity_1116113048_texture.glb');
          const bgModel = bgGltf.scene;
          
          // Scale and position background
          // We need to normalize the scale so it fits nicely
          const box = new THREE.Box3().setFromObject(bgModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 15 / maxDim; // Scale to roughly 15 units wide
          bgModel.scale.set(scale, scale, scale);
          bgModel.position.y = -2; // Move down slightly
          group.add(bgModel);
        } catch (err) {
          console.warn("Background GLB failed to load:", err);
          // Fallback: Add a simple ground plane if background fails
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x90ee90 })
          );
          plane.rotation.x = -Math.PI / 2;
          plane.position.y = -2;
          group.add(plane);
        }

        // 2. Load Character (Black Cat)
        try {
          const charGltf = await loader.loadAsync('/blackcat.glb');
          const charModel = charGltf.scene;

          // Normalize character size
          const box = new THREE.Box3().setFromObject(charModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetSize = 3.5; // Target height/width
          const scale = targetSize / maxDim;
          
          charModel.scale.set(scale, scale, scale);
          
          // Center the character
          const center = box.getCenter(new THREE.Vector3());
          charModel.position.x = -center.x * scale;
          charModel.position.y = -center.y * scale - 1.0; // Adjust height to stand on ground
          charModel.position.z = -center.z * scale + 1; // Bring slightly forward

          group.add(charModel);

          // Setup Animation if available
          if (charGltf.animations && charGltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(charModel);
            const action = mixer.clipAction(charGltf.animations[0]);
            action.play();
          }
        } catch (err) {
          console.error("Character GLB failed to load:", err);
          throw new Error("캐릭터 모델을 불러오지 못했습니다.");
        }

        setLoading(false);

      } catch (err) {
        console.error("Model loading error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadModels();

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      // Gentle camera movement or scene rotation
      // group.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;

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
        background: 'linear-gradient(180deg, #e0f7fa 0%, #e8f5e9 100%)',
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
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.5)'
          }}>
            Loading 3D World...
          </div>
        )}

        {error && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'red',
            fontWeight: 'bold',
            padding: 20
          }}>
            {error}
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