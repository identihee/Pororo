# db.py

import sqlite3
import pandas as pd
from datetime import datetime

DATABASE = 'pomodoro_data.db'
USER_ID = 'guest_user' # MVP에서 사용할 기본 사용자 ID

def get_db_connection():
    """데이터베이스 연결 객체를 반환합니다."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # 컬럼 이름으로 데이터 접근 가능
    return conn

def init_db():
    """테이블을 생성하고 DB를 초기화합니다. 스키마 마이그레이션도 처리합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. 테이블 생성 (없을 경우)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            theme TEXT NOT NULL,
            is_focus BOOLEAN NOT NULL,
            planned_duration INTEGER NOT NULL,
            actual_duration INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    # 2. 스키마 마이그레이션: 'theme' 컬럼이 없는 경우 추가
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'theme' not in columns:
        print("Migrating DB: Adding 'theme' column...")
        try:
            cursor.execute("ALTER TABLE sessions ADD COLUMN theme TEXT DEFAULT 'study'")
        except Exception as e:
            print(f"Migration failed: {e}")

    conn.commit()
    conn.close()

def save_session_record(is_focus, theme, planned_duration, actual_duration):
    """세션 기록을 DB에 저장합니다."""
    conn = get_db_connection()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute('''
        INSERT INTO sessions (user_id, is_focus, theme, planned_duration, actual_duration, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (USER_ID, is_focus, theme, planned_duration, actual_duration, timestamp))
    conn.commit()
    conn.close()

def load_user_sessions(theme=None):
    """사용자의 모든 세션 기록을 Pandas DataFrame으로 불러옵니다 (AI 분석용)."""
    conn = get_db_connection()
    
    query = f"SELECT * FROM sessions WHERE user_id = '{USER_ID}'"
    if theme:
        query += f" AND theme = '{theme}'"
    
    # DB 데이터를 pandas DataFrame으로 로드하여 데이터 분석에 용이하게 함
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

# 서버 시작 시 DB 초기화
init_db()