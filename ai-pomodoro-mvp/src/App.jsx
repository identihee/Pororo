// src/App.jsx

import React, { useState, useEffect } from 'react';
import CharacterStats from './CharacterStats';
import PomodoroTimer from './PomodoroTimer';
import BigTimer from './BigTimer';
import './App.css'; // 기본 CSS 파일

const API_URL = 'http://127.0.0.1:5000/api';

// Small stat card component used by the right column
function StatCard({ title, exp = 0, color = '#2b6b3a' }) {
  const total = Math.max(0, exp || 0);
  const level = Math.floor(total / 100) + 1;
  const percent = total % 100;
  return (
    <div style={{ padding: 12, borderRadius: 12, background: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 14, fontWeight: 900, color }}>{`Lv. ${level}`}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ height: 10, background: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: color }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>{percent}%</div>
      </div>
    </div>
  );
}

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

  // BigTimer modal state and mode chooser
  const [showBigTimer, setShowBigTimer] = useState(false);
  const [choosingMode, setChoosingMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState('study');
  // Stats / EXP state (totalExp stored as integer; 100 XP == next level)
  const [stats, setStats] = useState({
    intelligence: { exp: 120 },
    strength: { exp: 40 },
    focusStat: { exp: 75 },
  });

  const [quests, setQuests] = useState([
    { id: 1, title: '짧은 공부하기', desc: '20분 공부 세션 완료', stat: 'focusStat', reward: 30, completed: false },
    { id: 2, title: '스트레칭', desc: '10분 스트레칭 완료', stat: 'strength', reward: 20, completed: false },
    { id: 3, title: '퀵 리서치', desc: '15분 자료 조사', stat: 'intelligence', reward: 25, completed: false },
  ]);

  const addExp = (statKey, amount) => {
    setStats(prev => {
      const prevExp = prev[statKey]?.exp || 0;
      return { ...prev, [statKey]: { exp: prevExp + amount } };
    });
  };

  const claimQuest = (questId) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
    const q = quests.find(x => x.id === questId);
    if (q && !q.completed) {
      addExp(q.stat, q.reward);
    }
  };


  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏝️ PORORO ISLAND</h1>
        <p className="ai-message">{aiRecommendation.message}</p>
      </header>
      
      <main className="main-content">
        {/* Hero area: left stats, center character, right stats */}
        <section className="hero" style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: '22%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Timer moved to left column above stat cards */}
              <div style={{ padding: 12, borderRadius: 12, background: 'linear-gradient(180deg,#fffdf7,#f6fff2)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b6b6b', fontWeight: 700, marginBottom: 6 }}>추천</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#2b5d2b' }}>{aiRecommendation.recommended_focus}minute</div>
                <div style={{ marginTop: 10 }}>
                  <PomodoroTimer aiRecommendation={aiRecommendation} onSessionEnd={handleSessionEnd} />
                </div>
              </div>

              {/* Intelligence card (left side) - summary */}
              <div style={{ padding: 18, borderRadius: 12, background: '#fff7d6', boxShadow: '0 6px 14px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 14, color: '#a67a00', fontWeight: 800 }}>지력</div>
                <div style={{ fontSize: 26, color: '#d08f00', fontWeight: 900 }}>Lv. {Math.floor((stats.intelligence.exp||0)/100)+1}</div>
              </div>

              {/* Strength card (left side) - summary */}
              <div style={{ padding: 18, borderRadius: 12, background: '#ffecec', boxShadow: '0 6px 14px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 14, color: '#8b1f1f', fontWeight: 800 }}>근력</div>
                <div style={{ fontSize: 26, color: '#c62828', fontWeight: 900 }}>Lv. {Math.floor((stats.strength.exp||0)/100)+1}</div>
              </div>

              {/* Focus card (left side) - summary */}
              <div style={{ padding: 18, borderRadius: 12, background: '#e8f3ff', boxShadow: '0 6px 14px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 14, color: '#144f86', fontWeight: 800 }}>집중력</div>
                <div style={{ fontSize: 26, color: '#1565c0', fontWeight: 900 }}>{`Lv. ${Math.floor((stats.focusStat.exp||0)/100)+1}`}</div>
              </div>
            </div>
          </div>

          <div style={{ width: '56%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <CharacterStats totalFocusTime={totalFocusTime} canvasHeight={420} showDetails={false} />

              {/* Center area: character only. Keep only the "타이머 시작하기" button below the character (no center timer card) */}
              <div className="center-timer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
                <div style={{ marginTop: 12 }}>
                  {!choosingMode && (
                    <button
                      onClick={() => setChoosingMode(true)}
                      className="start-button"
                      style={{
                        padding: '10px 18px',
                        borderRadius: 14,
                        border: '2px solid rgba(0,0,0,0.06)',
                        background: 'linear-gradient(180deg,#fff8f0,#fffefb)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        boxShadow: '0 8px 18px rgba(0,0,0,0.08)'
                      }}
                    >
                      ▶️ 타이머 시작하기
                    </button>
                  )}

                  {choosingMode && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        onClick={() => { setSelectedMode('study'); setShowBigTimer(true); setChoosingMode(false); }}
                        style={{ padding: '10px 12px', borderRadius: 10, background: '#fff7d6', border: '2px solid #f1c46b', cursor: 'pointer', fontWeight: 700 }}
                      >공부</button>

                      <button
                        onClick={() => { setSelectedMode('exercise'); setShowBigTimer(true); setChoosingMode(false); }}
                        style={{ padding: '10px 12px', borderRadius: 10, background: '#ffecec', border: '2px solid #e26b6b', cursor: 'pointer', fontWeight: 700 }}
                      >운동</button>

                      <button
                        onClick={() => { setSelectedMode('work'); setShowBigTimer(true); setChoosingMode(false); }}
                        style={{ padding: '10px 12px', borderRadius: 10, background: '#e8f3ff', border: '2px solid #6b9fe2', cursor: 'pointer', fontWeight: 700 }}
                      >일</button>

                      <button
                        onClick={() => setChoosingMode(false)}
                        style={{ padding: '8px 10px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
                      >취소</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: '22%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Right-side: detailed stat cards with progress bars and Quest area */}

              <StatCard title="지력" statKey="intelligence" exp={stats.intelligence.exp} color="#d08f00" />

              <StatCard title="근력" statKey="strength" exp={stats.strength.exp} color="#c62828" />

              <StatCard title="집중력" statKey="focus" statKeyReal="focusStat" exp={stats.focusStat.exp} color="#1565c0" />

              <div className="quests" style={{ marginTop: 8, padding: 14, borderRadius: 12, background: '#f6fff6', boxShadow: '0 6px 14px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2b6b3a', marginBottom: 8 }}>퀘스트</div>
                    <div className="quest-list">
                    {quests.map(q => (
                      <div key={q.id} className="quest-item" style={{ background: q.completed ? '#f0f0f0' : '#fff' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800 }}>{q.title}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{q.desc} • 보상 {q.reward} XP</div>
                        </div>
                        <div>
                          <button onClick={() => !q.completed && claimQuest(q.id)} style={{ padding: '6px 10px', borderRadius: 8, background: q.completed ? '#dcdcdc' : '#e6fff0', border: '1px solid #cde9d1', cursor: q.completed ? 'default' : 'pointer' }}>{q.completed ? '완료' : '수령'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* BigTimer modal remains available globally */}
        <BigTimer
          isOpen={showBigTimer}
          onClose={() => setShowBigTimer(false)}
          selectedMode={selectedMode}
          initialFocusMinutes={aiRecommendation.recommended_focus}
          initialRestMinutes={aiRecommendation.recommended_rest}
          onSessionEnd={handleSessionEnd}
        />
      </main>
    </div>
  );
}

export default App;

