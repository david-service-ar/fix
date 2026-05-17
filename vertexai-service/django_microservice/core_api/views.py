import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core_api.schemas import ChatRequest
from core_api.services.ai_service import generate_response
from core_api.services.db_service import check_and_increment_usage, save_chat_message, get_user_history, get_user_usage
from core_api.auth import firebase_auth_required
from pydantic import ValidationError

@csrf_exempt
async def health_check(request):
    if request.method == "GET":
        return JsonResponse({"status": "online", "system": "Fix AI Core"})
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
@firebase_auth_required
async def chat_endpoint(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        body = json.loads(request.body)
        chat_request = ChatRequest(**body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)
    except ValidationError as e:
        return JsonResponse({"detail": e.errors()}, status=422)
        
    try:
        user_id = request.user_payload.get('uid')
        print(f"Procesando solicitud para usuario: {user_id}")
        is_allowed = await check_and_increment_usage(user_id)
        if not is_allowed:
            return JsonResponse({"detail": "Has alcanzado el límite de 10 consultas de prueba."}, status=403)
        
        db_history = await get_user_history(user_id)
        
        ai_text = await generate_response(chat_request.query, db_history)
        
        await save_chat_message(user_id, chat_request.query, ai_text)
        
        return JsonResponse({
            "response": ai_text,
            "status": "success"
        })
        
    except Exception as e:
        print(f"Error crítico: {e}")
        return JsonResponse({"detail": "Error en el núcleo neural de Fix"}, status=500)

@csrf_exempt
@firebase_auth_required
async def history_endpoint(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        user_id = request.user_payload.get('uid')
        db_history = await get_user_history(user_id, limit=50)
        usage = await get_user_usage(user_id)
        
        return JsonResponse({
            "history": db_history, 
            "usage": usage,
            "remaining_queries": max(0, 10 - usage),
            "status": "success"
        })
    except Exception as e:
        print(f"Error fetching history: {e}")
        return JsonResponse({"detail": "Error obteniendo el historial"}, status=500)

