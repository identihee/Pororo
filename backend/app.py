# app.py

import sqlite3
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 설정 ---
DATABASE = 'pomodoro_data.db'
DEFAULT_FOCUS = 25
DEFAULT_REST = 5
USER_ID = 'guest_user' # MVP에서는 단일 사용자 ID 사용

app = Flask(__name__)
CORS(app) # React 프론트엔드의 접근 허용


# --- 1. 데이터베이스 초기화 함수 ---
def init_db():
    """데이터베이스 파일이 없으면 생성하고 테이블을 만듭니다."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            is_focus BOOLEAN NOT NULL,
            planned_duration INTEGER NOT NULL,
            actual_duration INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# --- 2. AI 추천 로직 (핵심) ---
def get_recommendation_time(user_id):
    """
    사용자의 직전 세션 기록을 기반으로 다음 집중/휴식 시간을 제안합니다.
    """
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # 가장 최근에 완료된 집중 세션 하나를 가져옴
    cursor.execute('''
        SELECT planned_duration, actual_duration
        FROM sessions
        WHERE user_id = ? AND is_focus = 1
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (user_id,))
    last_session = cursor.fetchone()
    conn.close()

    # 초기값은 기본값으로 설정
    recommended_focus = DEFAULT_FOCUS
    message = "새로운 집중 세션을 시작해 보세요!"

    if last_session:
        planned, actual = last_session
        
        # 1. 직전 집중 세션 분석
        if actual >= planned * 0.95:
            # 95% 이상 완료: 집중력 유지/상승 -> 다음 집중 시간 3분 증가 (최대 50분)
            recommended_focus = min(50, planned + 3)
            message = "지난 세션을 성공적으로 완료했어요! 집중력이 올라가고 있습니다 💪"
        elif actual >= planned * 0.8:
            # 80% 이상 완료: 현재 시간 유지
            recommended_focus = planned
            message = "좋은 집중력을 유지하고 있어요. 다음 세션도 화이팅!"
        else:
            # 80% 미만 완료: 중간에 포기했을 가능성 -> 다음 집중 시간 5분 감소 (최소 10분)
            recommended_focus = max(10, planned - 5)
            message = "잠깐 어려움이 있었나요? 다음 집중 시간을 조금 줄여서 다시 시도해 보세요! 😊"
    
    # 2. 휴식 시간 계산: 집중 시간의 1/5 비율 적용 (최소 5분)
    recommended_rest = max(5, round(recommended_focus / 5))

    return {
        "recommended_focus": recommended_focus,
        "recommended_rest": recommended_rest,
        "message": message
    }

# --- 3. API 엔드포인트 구현 ---

@app.before_request
def before_request():
    """모든 요청 전에 데이터베이스 연결을 설정합니다."""
    init_db()

@app.route('/api/session/end', methods=['POST'])
def post_session_end():
    """사용자의 집중/휴식 세션 기록을 데이터베이스에 저장합니다."""
    data = request.json
    
    # 필수 데이터 검증
    if not all(k in data for k in ['is_focus', 'planned_duration', 'actual_duration']):
        return jsonify({"message": "누락된 데이터가 있습니다."}), 400

    is_focus = data['is_focus']
    planned_duration = data['planned_duration']
    actual_duration = data['actual_duration']
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO sessions (user_id, is_focus, planned_duration, actual_duration, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (USER_ID, is_focus, planned_duration, actual_duration, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"message": f"데이터베이스 오류: {str(e)}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "세션 기록이 성공적으로 저장되었습니다."}), 201


@app.route('/api/session/recommendation', methods=['GET'])
def get_recommendation():
    """AI 로직을 실행하여 다음 뽀모도로 시간을 제안합니다."""
    
    recommendation = get_recommendation_time(USER_ID)
    
    return jsonify(recommendation), 200

# --- 4. 서버 실행 ---

if __name__ == '__main__':
    init_db() # 서버 시작 시 DB 초기화
    # 디버그 모드로 5000 포트에서 서버 실행
    app.run(debug=True, port=5000)