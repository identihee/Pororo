// src/App.jsx

import React, { useState, useEffect } from 'react';
import CharacterStats from './CharacterStats';
import PomodoroTimer from './PomodoroTimer';
import './App.css'; // 기본 CSS 파일

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  // === MVP 상태 관리 ===
  // 1. AI 추천 시간 (초기값: 25분 집중, 5분 휴식)
  const [aiRecommendation, setAiRecommendation] = useState({
    recommended_focus: 25,
    recommended_rest: 5,
    message: "AI가 추천 시간을 로딩 중입니다..."
  });
  
  // 2. 총 집중 시간 (분 단위)
  const [totalFocusTime, setTotalFocusTime] = useState(0); 

  // 1. AI 추천 시간을 백엔드로부터 가져오는 함수
  const fetchRecommendation = async () => {
    try {
      const response = await fetch(`${API_URL}/session/recommendation`);
      if (!response.ok) throw new Error('API 요청 실패');
      
      const data = await response.json();
      setAiRecommendation(data);
      console.log("AI 추천 시간 업데이트:", data);
    } catch (error) {
      console.error("추천 시간을 가져오는 중 오류 발생:", error);
      // 오류 시 기본값 설정
      setAiRecommendation({
        recommended_focus: 25,
        recommended_rest: 5,
        message: "네트워크 오류로 기본값으로 시작합니다."
      });
    }
  };

  // 2. 세션 종료 기록을 백엔드에 전송하는 함수
  const postSessionEnd = async (isFocus, plannedDuration, actualDuration) => {
    try {
      const response = await fetch(`${API_URL}/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_focus: isFocus,
          planned_duration: plannedDuration,
          actual_duration: actualDuration,
        }),
      });

      if (!response.ok) throw new Error('세션 기록 저장 실패');
      
      console.log(`세션 기록 성공: ${isFocus ? '집중' : '휴식'} ${actualDuration}분`);
      
      // 기록이 성공하면, 바로 새로운 추천 시간을 요청합니다.
      if (isFocus) {
        setTotalFocusTime(prev => prev + actualDuration);
        await fetchRecommendation();
      }

    } catch (error) {
      console.error("세션 기록 중 오류 발생:", error);
    }
  };

  // --- 라이프사이클 및 이벤트 핸들러 ---

  // 컴포넌트 마운트 시 최초 1회 추천 시간 요청
  useEffect(() => {
    fetchRecommendation();
  }, []); 

  // 세션 종료 시 호출되어 백엔드에 기록하고 AI 추천을 업데이트하는 함수
  const handleSessionEnd = (isFocus, plannedDuration, actualDuration) => {
    // 실제 사용자가 완료한 시간(actualDuration)을 백엔드로 보냅니다.
    postSessionEnd(isFocus, plannedDuration, actualDuration);
  };


  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏡 AI 뽀모도로 섬</h1>
        <p className="ai-message">{aiRecommendation.message}</p>
      </header>
      
      <main className="main-content">
        <section className="stats-section">
          <CharacterStats totalFocusTime={totalFocusTime} />
        </section>
        
        <section className="timer-section">
          <PomodoroTimer 
            aiRecommendation={aiRecommendation}
            onSessionEnd={handleSessionEnd}
          />
        </section>
      </main>
    </div>
  );
}

export default App;

