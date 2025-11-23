import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api'

def test_save_session():
    print("Testing save session...")
    payload = {
        "is_focus": True,
        "planned_duration": 25,
        "actual_duration": 5,
        "theme": "study"
    }
    try:
        response = requests.post(f"{BASE_URL}/session/end", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_get_stats():
    print("\nTesting get stats...")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_save_session()
    test_get_stats()
