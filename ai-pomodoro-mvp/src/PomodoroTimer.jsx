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

  // 타이머 카운트다운 로직
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 10);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);


  // 세션 종료 및 전환 로직
  useEffect(() => {
    if (timeRemaining === 0) {
      handleComplete();
    }
  }, [timeRemaining]);

  const handleComplete = () => {
    setIsRunning(false);
    
    const sessionType = isFocusing ? '집중' : '휴식';
    const plannedDuration = isFocusing ? aiRecommendation.recommended_focus : aiRecommendation.recommended_rest;
    
    // onSessionEnd를 호출하여 백엔드에 기록 (완료 시 planned == actual)
    onSessionEnd(isFocusing, plannedDuration, plannedDuration); 

    // 알림 및 상태 전환
    alert(`🔔 ${sessionType} 시간이 종료되었습니다! 다음은 ${isFocusing ? '휴식' : '집중'}을 시작하세요.`);
    
    // 다음 세션 시간 설정
    const nextDuration = isFocusing 
        ? aiRecommendation.recommended_rest * 60 
        : aiRecommendation.recommended_focus * 60;
    
    setIsFocusing(prev => !prev); 
    setTimeRemaining(nextDuration); 
  };

  // 중도 포기/완료 처리 함수
  const handleStopAndSave = () => {
    if (!isFocusing) {
        // 휴식 시간 중단은 그냥 리셋
        setIsRunning(false);
        setTimeRemaining(aiRecommendation.recommended_focus * 60);
        setIsFocusing(true);
        return;
    }

    const plannedDuration = aiRecommendation.recommended_focus;
    const actualDuration = Math.floor((plannedDuration * 60 - timeRemaining) / 60);

    if (actualDuration < 1) {
        alert("1분 미만의 집중은 기록되지 않습니다.");
        setIsRunning(false);
        setTimeRemaining(plannedDuration * 60);
        return;
    }

    if (window.confirm(`현재까지 ${actualDuration}분 집중했습니다. 기록하고 종료할까요?`)) {
        onSessionEnd(true, plannedDuration, actualDuration);
        setIsRunning(false);
        setTimeRemaining(aiRecommendation.recommended_focus * 60); // 리셋
        // setIsFocusing(true); // 이미 true임
    }
  };

  // 시간 표시 포맷 (MM:SS)
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
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

          {/* 중단 및 저장 버튼 추가 */}
          <button onClick={handleStopAndSave} style={{ padding: '10px 12px', borderRadius: 12, background: '#ffebee', border: '1px solid #ffcdd2', fontWeight: 700, cursor: 'pointer', color: '#c62828' }}>⏹️ 완료 및 저장</button>

          <button onClick={() => { setIsRunning(false); setIsFocusing(true); setTimeRemaining(aiRecommendation.recommended_focus * 60); }} style={{ padding: '10px 12px', borderRadius: 12, background: '#eef6ff', border: '1px solid #cfe1ff', fontWeight: 700, cursor: 'pointer' }}>🔄 리셋</button>
        </div>

        <p style={{ marginTop: 12, fontStyle: 'italic', color: '#6b6b6b' }}>{isFocusing ? '열심히 집중하고 섬을 키워보아요!' : '새참 먹고 잠시 쉬어가세요!'}</p>
      </div>
    </div>
  );
};

export default PomodoroTimer;