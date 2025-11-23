# ai_logic.py

from db import load_user_sessions
import numpy as np

# --- AI 로직 상수 ---
MIN_FOCUS = 10
MAX_FOCUS = 50
SUCCESS_THRESHOLD = 0.95 # 95% 이상 달성 시 성공
FAILURE_THRESHOLD = 0.8  # 80% 미만 달성 시 실패
REST_RATIO = 5           # 집중 시간의 1/5을 휴식 시간으로 설정

def get_smart_recommendation(theme):
    """테마별 사용자의 기록을 분석하여 최적의 집중/휴식 시간을 제안합니다."""
    
    # 1. 테마별 사용자 데이터 로드
    df = load_user_sessions(theme=theme)
    focus_df = df[df['is_focus'] == 1].copy()
    
    recommended_focus = 25 # 기본 시작 시간 (표준 뽀모도로)
    message = f"새로운 {theme} 집중 세션을 시작해 보세요!"

    if focus_df.empty:
        # 기록이 없는 경우 기본값 사용
        pass
    else:
        # 2. 직전 세션 분석 (가장 최근 세션)
        last_session = focus_df.sort_values(by='timestamp', ascending=False).iloc[0]
        planned = last_session['planned_duration']
        actual = last_session['actual_duration']
        achievement_rate = actual / planned
        
        # 3. 스마트 규칙 적용
        if achievement_rate >= SUCCESS_THRESHOLD:
            # 연속 성공 보상: 3분 증가 (최대치 제한)
            recommended_focus = min(MAX_FOCUS, planned + 3)
            message = f"**{theme}** 집중력이 최고예요! 다음 세션 시간을 조금 늘려볼까요? 💪"
        elif achievement_rate < FAILURE_THRESHOLD:
            # 연속 실패 조정: 5분 감소 (최소치 제한)
            recommended_focus = max(MIN_FOCUS, planned - 5)
            message = f"잠깐 어려움이 있었나요? 다음 집중 시간을 줄여서 스트레스 없이 성공해 보세요! 😊"
        else:
             # 평균 회귀: 중간 달성률은 현재 시간 유지
             recommended_focus = planned
             
        # TODO: 향후 요일/시간대 분석 규칙 추가 가능
        
    # 4. 휴식 시간 계산
    recommended_rest = max(5, round(recommended_focus / REST_RATIO))

    return {
        "recommended_focus": int(recommended_focus),
        "recommended_rest": int(recommended_rest),
        "message": message
    }