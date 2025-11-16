// src/PomodoroTimer.jsx (수정된 코드)

import React, { useState, useEffect } from 'react';

const PomodoroTimer = ({ onSessionEnd, aiRecommendation }) => {
  
  // App.jsx에서 넘어온 AI 추천 시간을 기준으로 상태 초기화 (처음에는 25/5)
  const [isFocusing, setIsFocusing] = useState(true); 
  const [isRunning, setIsRunning] = useState(false); 
  // 초기 시간은 무조건 Focus 시간으로 설정
  const [timeRemaining, setTimeRemaining] = useState(aiRecommendation.recommended_focus * 60);

  // AI 추천 시간이 변경될 때 타이머를 초기 Focus 시간으로 리셋
  useEffect(() => {
    // 타이머가 멈춰 있을 때, 또는 현재 세션이 완전히 종료된 상태일 때만 시간을 업데이트
    if (!isRunning || timeRemaining === 0) {
        // 현재 모드가 Focus일 때만 추천 Focus 시간으로 업데이트
        if(isFocusing) {
           setTimeRemaining(aiRecommendation.recommended_focus * 60);
        }
    }
  }, [aiRecommendation]); // aiRecommendation이 변경될 때마다 실행

  // 타이머 카운트다운 로직 (이전과 동일)
  useEffect(() => {
    // ... (이전 코드와 동일, 생략)
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);


  // 세션 종료 및 전환 로직 (수정)
  useEffect(() => {
    if (timeRemaining === 0) {
      setIsRunning(false);
      
      const sessionType = isFocusing ? '집중' : '휴식';
      const plannedDuration = isFocusing ? aiRecommendation.recommended_focus : aiRecommendation.recommended_rest;
      
      // onSessionEnd를 호출하여 백엔드에 기록 (실제 완료 시간은 plannedDuration과 동일하다고 가정)
      onSessionEnd(isFocusing, plannedDuration, plannedDuration); 

      // 알림 및 상태 전환
      alert(`🔔 ${sessionType} 시간이 종료되었습니다! 다음은 ${isFocusing ? '휴식' : '집중'}을 시작하세요.`);
      
      // 다음 세션 시간 설정 (AI가 업데이트되었을 수 있으므로 최신 props 사용)
      const nextDuration = isFocusing 
          ? aiRecommendation.recommended_rest * 60 
          : aiRecommendation.recommended_focus * 60;
      
      setIsFocusing(prev => !prev); 
      setTimeRemaining(nextDuration); 
    }
  }, [timeRemaining, isFocusing, onSessionEnd, aiRecommendation]);

  // 시간 표시 포맷 (MM:SS) (이전과 동일)
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const currentMode = isFocusing ? '집중' : '휴식';

  return (
    // ... (UI 렌더링 코드는 이전과 동일, aiRecommendation prop을 사용하도록 업데이트됨)
    <div style={{ /* ... style */ }}>
      <h3 style={{ color: '#d32f2f' }}>🍅 AI 맞춤 뽀모도로 ({currentMode} 모드)</h3>
      <p style={{ fontWeight: 'bold' }}>
        추천: **{isFocusing ? aiRecommendation.recommended_focus : aiRecommendation.recommended_rest}분**
      </p>
      
      {/* ... 타이머 및 버튼 UI ... */}
      <div style={{ 
          /* ... style */
          color: isFocusing ? '#e53935' : '#43a047',
          border: `4px solid ${isFocusing ? '#e53935' : '#43a047'}`,
          /* ... style */
      }}>
        {displayTime}
      </div>
      
      {/* 컨트롤 버튼 */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setIsRunning(prev => !prev)}
          // ... (스타일 생략)
        >
          {isRunning ? '⏸️ 일시 정지' : '▶️ 시작'}
        </button>
        
        <button 
          onClick={() => {
            setIsRunning(false);
            setIsFocusing(true);
            setTimeRemaining(aiRecommendation.recommended_focus * 60);
          }}
          // ... (스타일 생략)
        >
          🔄 리셋
        </button>
      </div>
      
      <p style={{ marginTop: '15px', fontStyle: 'italic', color: '#757575' }}>
        {isFocusing ? '열심히 집중하고 섬을 키워보아요!' : '새참 먹고 잠시 쉬어가세요!'}
      </p>
    </div>
  );
};

export default PomodoroTimer;