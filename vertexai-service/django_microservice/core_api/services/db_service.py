import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import BaseQuery
from asgiref.sync import sync_to_async

def get_db() -> firestore.client:
    return firestore.client(database_id='fixdb')

@sync_to_async
def check_and_increment_usage(user_id: str, limit: int = 10) -> bool:
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()

    if doc.exists:
        data = doc.to_dict()
        if data.get('query_count', 0) >= limit:
            return False
        user_ref.update({'query_count': firestore.Increment(1)})
    else:
        user_ref.set({'query_count': 1, 'created_at': firestore.SERVER_TIMESTAMP})

    return True

@sync_to_async
def get_user_usage(user_id: str) -> int:
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()
    if doc.exists:
        data = doc.to_dict()
        return data.get('query_count', 0)
    return 0

@sync_to_async
def save_chat_message(user_id: str, query: str, response: str) -> None:
    db = get_db()
    db.collection('users').document(user_id).collection('history').add({
        'query': query,
        'response': response,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

@sync_to_async
def get_user_history(user_id: str, limit: int = 10) -> list:
    db = get_db()
    docs = (
        db.collection('users')
          .document(user_id)
          .collection('history')
          .order_by('timestamp', direction=BaseQuery.DESCENDING)
          .limit(limit)
          .stream()
    )

    history = []
    for doc in docs:
        data = doc.to_dict()
        history.insert(0, {"role": "assistant", "content": data.get("response", "")})
        history.insert(0, {"role": "user", "content": data.get("query", "")})

    return history
