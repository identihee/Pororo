# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from db import init_db, save_session_record, load_user_sessions
from ai_logic import get_smart_recommendation

app = Flask(__name__)
CORS(app) # React 프론트엔드의 접근 허용

# --- API 엔드포인트 구현 ---

@app.before_request
def before_request():
    """모든 요청 전에 데이터베이스 연결을 설정합니다."""
    init_db()

@app.route('/api/session/end', methods=['POST'])
def post_session_end():
    """사용자의 집중/휴식 세션 기록을 데이터베이스에 저장합니다."""
    data = request.json
    print(f"Received session end data: {data}") # Debug log
    
    # 필수 데이터 검증
    if not all(k in data for k in ['is_focus', 'planned_duration', 'actual_duration']):
        return jsonify({"message": "누락된 데이터가 있습니다."}), 400

    # Boolean to Integer conversion for consistency
    is_focus = 1 if data['is_focus'] else 0
    planned_duration = data['planned_duration']
    actual_duration = data['actual_duration']
    theme = data.get('theme', 'study') # 기본 테마는 'study'
    
    try:
        save_session_record(is_focus, theme, planned_duration, actual_duration)
        print("Session saved successfully") # Debug log
        return jsonify({"message": "세션 기록이 성공적으로 저장되었습니다."}), 201
    except Exception as e:
        print(f"Error saving session: {e}") # Debug log
        return jsonify({"message": f"데이터베이스 오류: {str(e)}"}), 500

@app.route('/api/quest/claim', methods=['POST'])
def claim_quest():
    """퀘스트 완료 보상을 스탯에 반영합니다."""
    data = request.json
    print(f"Received quest claim: {data}") # Debug log
    
    quest_id = data.get('quest_id')
    stat_type = data.get('stat_type') # 'intelligence', 'strength', 'focus'
    reward = data.get('reward', 0)
    
    # 퀘스트 보상을 '세션 기록'으로 저장하여 스탯에 반영 (MVP 간소화)
    # theme 매핑: intelligence -> study, strength -> exercise, focus -> work
    theme_map = {
        'intelligence': 'study',
        'strength': 'exercise',
        'focusStat': 'work', # 프론트엔드에서 focusStat으로 보냄
        'focus': 'work'
    }
    
    theme = theme_map.get(stat_type, 'study')
    
    try:
        # 실제 집중 시간으로 reward만큼 추가. is_focus=1 (True)
        save_session_record(1, theme, reward, reward)
        print(f"Quest reward saved: {reward} for {theme}") # Debug log
        return jsonify({"message": "퀘스트 보상이 지급되었습니다."}), 200
    except Exception as e:
        print(f"Error claiming quest: {e}") # Debug log
        return jsonify({"message": str(e)}), 500

@app.route('/api/session/recommendation', methods=['GET'])
def get_recommendation():
    """AI 로직을 실행하여 다음 뽀모도로 시간을 제안합니다."""
    theme = request.args.get('theme', 'study') # 쿼리 파라미터로 테마를 받을 수 있음
    print(f"Generating recommendation for theme: {theme}") # Debug log
    try:
        recommendation = get_smart_recommendation(theme)
        print(f"Recommendation: {recommendation}") # Debug log
        return jsonify(recommendation), 200
    except Exception as e:
        print(f"Error generating recommendation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """사용자의 테마별 스탯(지력, 근력, 집중력)을 반환합니다."""
    try:
        df = load_user_sessions()
        
        stats = {
            "intelligence": 0, # 공부 (study)
            "strength": 0,     # 운동 (exercise)
            "focus": 0         # 일 (work)
        }

        if not df.empty:
            # Ensure is_focus is numeric for filtering
            # SQLite might return 1/0, but pandas might see it differently depending on driver
            # Force conversion to numeric, coercing errors
            df['is_focus'] = pd.to_numeric(df['is_focus'], errors='coerce')
            
            # is_focus가 1인(집중 시간) 데이터만 필터링
            focus_df = df[df['is_focus'] == 1]
            
            if not focus_df.empty:
                # 테마별로 그룹화하여 actual_duration 합계 계산
                theme_stats = focus_df.groupby('theme')['actual_duration'].sum().to_dict()
                
                # 매핑
                stats["intelligence"] = int(theme_stats.get('study', 0))
                stats["strength"] = int(theme_stats.get('exercise', 0))
                stats["focus"] = int(theme_stats.get('work', 0))
        
        print(f"Returning stats: {stats}") # Debug log
        return jsonify(stats)
    except Exception as e:
        print(f"Error getting stats: {e}") # Debug log
        return jsonify({"intelligence": 0, "strength": 0, "focus": 0, "error": str(e)})

if __name__ == '__main__':
    init_db() # 서버 시작 시 DB 초기화
    print("Starting Flask server on port 5001...")
    app.run(debug=True, port=5001)