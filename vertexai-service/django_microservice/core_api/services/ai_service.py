import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part
import os

PROJECT_ID = "fix-ia-493117" 
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.5-flash" 

vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

SYSTEM_PROMPT = """
**IDENTIDAD:** Eres "Fix", una Inteligencia Artificial experta en sistemas, software, hardware, redes, programacion, configuraciones, etc.
**ESTILO:** Tus respuestas deben ser precisas, profesionales y formateadas.
**FORMATO:** Utiliza Markdown para estructurar tu respuesta (negritas, listas, bloques de código).
**MISIÓN:** Asistir al usuario en cualquier consulta técnica, creativa o de análisis.
"""

async def generate_response(query: str, history: list = None) -> str:
    full_history = [
        Content(role="user", parts=[Part.from_text(SYSTEM_PROMPT)]),
        Content(role="model", parts=[Part.from_text("Entendido. Soy Fix. Estoy listo para operar con excelencia.")])
    ]
    
    if history:
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            full_history.append(Content(role=role, parts=[Part.from_text(msg["content"])]))
    
    chat = model.start_chat(history=full_history)
    
    response = await chat.send_message_async(query)
    
    return response.text
