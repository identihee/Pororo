import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5001/api'

def get_stats():
    try:
        response = requests.get(f"{BASE_URL}/stats?_t={int(time.time())}")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get stats: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting stats: {e}")
        return None

def test_flow():
    print("1. Initial Stats:")
    initial_stats = get_stats()
    print(initial_stats)
    
    if initial_stats is None:
        return

    print("\n2. Adding Study Session (5 mins)...")
    payload = {
        "is_focus": True,
        "planned_duration": 25,
        "actual_duration": 5,
        "theme": "study"
    }
    try:
        response = requests.post(f"{BASE_URL}/session/end", json=payload)
        print(f"Save Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error saving session: {e}")
        return

    print("\n3. Stats after update:")
    new_stats = get_stats()
    print(new_stats)
    
    if new_stats:
        diff = new_stats['intelligence'] - initial_stats['intelligence']
        print(f"\nIntelligence increased by: {diff} (Expected: 5)")

if __name__ == "__main__":
    test_flow()
