from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = [] 

class ChatResponse(BaseModel):
    response: str
    status: str = "success"
