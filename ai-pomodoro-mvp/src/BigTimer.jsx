import React, { useEffect, useState } from 'react';
import './BigTimer.css';

const BigTimer = ({
  isOpen,
  onClose,
  selectedMode = 'study', // 'study' | 'exercise' | 'work'
  initialFocusMinutes = 25,
  initialRestMinutes = 5,
  onSessionEnd = () => {},
}) => {
  const [isFocusing, setIsFocusing] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialFocusMinutes * 60);

  // reset when opened or when props change
  useEffect(() => {
    if (isOpen) {
      setIsFocusing(true);
      setIsRunning(false);
      setTimeRemaining(initialFocusMinutes * 60);
    }
  }, [isOpen, initialFocusMinutes]);

  // keep local minutes in sync if user changes recommended times while open
  useEffect(() => {
    if (!isRunning && isFocusing) {
      setTimeRemaining(initialFocusMinutes * 60);
    }
  }, [initialFocusMinutes]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const id = setInterval(() => {
      setTimeRemaining((t) => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, timeRemaining]);

  // session end handling
  useEffect(() => {
    if (timeRemaining === 0) {
      setIsRunning(false);

      const planned = isFocusing ? initialFocusMinutes : initialRestMinutes;
      // report to parent
      onSessionEnd(isFocusing, planned, planned);

      // small celebration (simple): flip mode and set next duration
      setTimeout(() => {
        setIsFocusing((s) => !s);
        setTimeRemaining((isFocusing ? initialRestMinutes : initialFocusMinutes) * 60);
      }, 700);
    }
  }, [timeRemaining, isFocusing, initialFocusMinutes, initialRestMinutes, onSessionEnd]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const seconds = (timeRemaining % 60).toString().padStart(2, '0');
  const display = `${minutes}:${seconds}`;

  // determine visual class and emoji by selected mode (only when focusing)
  const modeClass = isFocusing ? selectedMode : 'rest';
  const leafEmoji = isFocusing
    ? (selectedMode === 'study' ? '📚' : selectedMode === 'exercise' ? '🏃' : '💼')
    : '🍃';

  const modeLabel = isFocusing ? (selectedMode === 'study' ? '공부' : selectedMode === 'exercise' ? '운동' : '일') : '휴식';

  return (
    <div className="bigtimer-overlay" onMouseDown={(e) => { if (e.target.classList.contains('bigtimer-overlay')) onClose(); }}>
      <div className="bigtimer-modal">
        <div className="bigtimer-header">
          <div className="bigtimer-title">PORORO ISLAND — 타이머</div>
          <button className="bigtimer-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="bigtimer-body">
          <div className={`bigtimer-leaf ${modeClass}`}>{leafEmoji}</div>

          <div className={`bigtimer-time ${modeClass}`}>{display}</div>

          <div className="bigtimer-mode">{modeLabel} {isFocusing ? '모드' : '모드 (휴식)'}</div>

          <div className="bigtimer-controls">
            <button className="btn primary" onClick={() => setIsRunning((r) => !r)}>
              {isRunning ? '⏸️ 일시정지' : '▶️ 시작'}
            </button>

            <button className="btn" onClick={() => {
              setIsRunning(false);
              setIsFocusing(true);
              setTimeRemaining(initialFocusMinutes * 60);
            }}>🔄 리셋</button>

            <button className="btn ghost" onClick={() => {
              setIsRunning(false);
              onClose();
            }}>✖️ 닫기</button>
          </div>

          <div className="bigtimer-footnote">섬 풍경을 떠올리며 집중해요 — 포근한 자연 효과음 추천!</div>
        </div>
      </div>
    </div>
  );
};

export default BigTimer;
