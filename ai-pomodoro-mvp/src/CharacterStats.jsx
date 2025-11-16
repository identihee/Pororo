// src/CharacterStats.jsx

import React, { useRef, useEffect }from 'react';
import * as THREE from 'three'; // Three.js 코어 임포트
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // GLTF 로더 임포트

const CharacterStats = ({ totalFocusTime }) => {
  const mountRef = useRef(null); // Three.js 캔버스를 마운트할 DOM 요소를 참조
  useEffect(() => {
    // === Three.js 씬 설정 ===
    const currentMount = mountRef.current;
    if (!currentMount) return; // 마운트할 요소가 없으면 종료

    // 1. Scene (장면)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3e5f5); // 배경색을 컴포넌트 배경과 유사하게 설정

    // 2. Camera (카메라)
    const camera = new THREE.PerspectiveCamera(
      75, // field of view
      currentMount.clientWidth / currentMount.clientHeight, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );
    camera.position.set(0, 1, 3); // 카메라 위치 조정 (모델이 보이도록)

    // 3. Renderer (렌더러)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement); // DOM에 캔버스 추가

    // 4. Lights (조명)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 은은한 주변광
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // 방향광
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // 5. GLB 모델 로드
    const loader = new GLTFLoader();
    let characterModel; // 모델 인스턴스를 저장할 변수

    loader.load(
      '/blackcat.glb', // public 폴더에 있는 GLB 파일 경로
      (gltf) => {
        characterModel = gltf.scene;
        characterModel.scale.set(1, 1, 1); // 모델 크기 조정
        characterModel.position.set(0, -0.5, 0); // 모델 위치 조정
        scene.add(characterModel);
      },
      undefined, // onProgress 콜백 (선택 사항)
      (error) => {
        console.error('GLB 모델 로드 중 오류 발생:', error);
      }
    );

    // 6. 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);

      if (characterModel) {
        // 모델을 계속 회전시켜서 3D임을 보여주는 예시
        characterModel.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    // 7. 창 크기 변경 시 렌더러와 카메라 업데이트
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. 클린업 함수: 컴포넌트 언마운트 시 Three.js 리소스 해제
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
      // 가비지 컬렉션을 위해 다른 Three.js 객체들도 dispose할 수 있지만, MVP에서는 생략
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행
//-------------------------------------------



  // totalFocusTime은 App.jsx에서 받은 총 집중 시간 (분)
  const hours = Math.floor(totalFocusTime / 60);
  const minutes = totalFocusTime % 60;
  
  // 30분 집중당 열매 1개 획득 (귀여움 컨셉)
  const fruitCount = Math.floor(totalFocusTime / 30); 




  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f3e5f5', // 연한 보라색 배경
      borderRadius: '15px', 
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      height: '100%', // Three.js 캔버스가 채울 수 있도록 높이 지정
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between', // 내용물 배치 조정
    }}>
      <h2>✨ 나의 섬 생활</h2>
      {/* 귀여운 캐릭터 이미지 자리 표시자 */}
      <div 
        ref={mountRef} 
        style={{ 
          width: '100%', 
          height: '250px', // 캔버스 높이 지정
          backgroundColor: '#cfe9f5', // 캔버스 배경 (씬 배경과 유사하게)
          borderRadius: '10px',
          overflow: 'hidden', // 넘치는 내용물 숨김
          margin: '10px 0'
        }} 
      />
      <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#6a1b9a' }}>
        오늘 총 집중 시간: **{hours}시간 {minutes}분**
      </p>
      <p style={{ fontSize: '1em', color: '#888' }}>
        열매 🍎 **{fruitCount}개** 획득! 🌳
      </p>
    </div>
  );
};

export default CharacterStats;