import json
import httpx
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from gateway_api.schemas import ChatRequest
from gateway_api.config import MICROSERVICE_URL
from pydantic import ValidationError

@csrf_exempt
async def health_check(request):
    if request.method == "GET":
        return JsonResponse({"status": "online", "service": "Gateway"})
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
async def proxy_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return JsonResponse({"detail": "Gateway: No recibí ningún token de autenticación"}, status=401)

    try:
        body = json.loads(request.body)
        chat_request = ChatRequest(**body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)
    except ValidationError as e:
        return JsonResponse({"detail": e.errors()}, status=422)

    forward_headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }

    brain_endpoint = f"{MICROSERVICE_URL}/chat"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                brain_endpoint,
                json=chat_request.model_dump(),
                headers=forward_headers, 
                timeout=110.0
            )
            
            if response.status_code != 200:
                return JsonResponse({"detail": f"microservicio respondió: {response.text}"}, status=response.status_code)
                
            return JsonResponse(response.json(), status=200)

        except httpx.RequestError as e:
            print(f"Error de conexión Gateway-microservicio: {e}")
            return JsonResponse({"detail": "El Gateway no pudo alcanzar al microservicio"}, status=503)

@csrf_exempt
async def proxy_history(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return JsonResponse({"detail": "Gateway: No recibí ningún token de autenticación"}, status=401)

    forward_headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }

    brain_endpoint = f"{MICROSERVICE_URL}/history"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                brain_endpoint,
                headers=forward_headers, 
                timeout=15.0
            )
            
            if response.status_code != 200:
                return JsonResponse({"detail": f"microservicio respondió: {response.text}"}, status=response.status_code)
                
            return JsonResponse(response.json(), status=200)

        except httpx.RequestError as e:
            print(f"Error de conexión Gateway-microservicio: {e}")
            return JsonResponse({"detail": "El Gateway no pudo alcanzar al microservicio"}, status=503)
