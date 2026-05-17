import firebase_admin
from firebase_admin import auth, credentials
from django.http import JsonResponse
from functools import wraps
from asgiref.sync import sync_to_async

try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(options={"projectId": "fix-ia-493117"})

def firebase_auth_required(view_func):
    @wraps(view_func)
    async def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"detail": "Not authenticated"}, status=401)
        
        token = auth_header.split(" ")[1]
        try:
            verify_token_sync = sync_to_async(auth.verify_id_token)
            decoded_token = await verify_token_sync(token)
            request.user_payload = decoded_token
        except Exception as e:
            print(f"Error de Auth: {e}")
            return JsonResponse({"detail": "Credenciales inválidas o expiradas"}, status=401)
            
        return await view_func(request, *args, **kwargs)
    return _wrapped_view
