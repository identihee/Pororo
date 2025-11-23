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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Recommendation shown as e.g. '25minute' centered */}
      <div style={{ marginBottom: 8, fontWeight: 800, color: '#6b6b6b' }}>{`${aiRecommendation.recommended_focus}minute`}</div>

      {/* Timer display - pastel rounded card instead of colored border */}
      <div style={{
        width: 420,
        maxWidth: '100%',
        textAlign: 'center',
        padding: '28px 12px',
        borderRadius: 18,
        background: 'linear-gradient(180deg, #fffaf3, #f7fff6)',
        boxShadow: '0 12px 30px rgba(15,40,20,0.06)'
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: '#2b5d2b', letterSpacing: 2 }}>{displayTime}</div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setIsRunning(prev => !prev)} style={{ padding: '10px 16px', borderRadius: 12, background: '#fff6e6', border: '1px solid #f1d7a6', fontWeight: 800, cursor: 'pointer' }}>{isRunning ? '⏸️ 일시 정지' : '▶️ 시작'}</button>

          <button onClick={() => { setIsRunning(false); setIsFocusing(true); setTimeRemaining(aiRecommendation.recommended_focus * 60); }} style={{ padding: '10px 12px', borderRadius: 12, background: '#eef6ff', border: '1px solid #cfe1ff', fontWeight: 700, cursor: 'pointer' }}>🔄 리셋</button>
        </div>

        <p style={{ marginTop: 12, fontStyle: 'italic', color: '#6b6b6b' }}>{isFocusing ? '열심히 집중하고 섬을 키워보아요!' : '새참 먹고 잠시 쉬어가세요!'}</p>
      </div>
    </div>
  );
};

export default PomodoroTimer;