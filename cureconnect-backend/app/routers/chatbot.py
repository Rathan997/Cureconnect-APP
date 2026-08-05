from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
import os
import httpx

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
        
        messages = [
            {
                "role": "system",
                "content": (
                    "You are CureConnect AI, a friendly and knowledgeable health assistant for users in Tamil Nadu, India. "
                    "Give short, safe medical guidance. "
                    "Always recommend consulting a real doctor for serious conditions. "
                    "Be empathetic and supportive. "
                    "Give advice relevant to Indian context (Tamil Nadu). "
                    "For emergencies always say call 108. "
                    "Keep responses concise and easy to understand. "
                    "Use simple language, not medical jargon. "
                    "Add relevant emojis to make responses friendly. "
                    "Never diagnose conditions definitively — always say 'possible' or 'might be'."
                )
            }
        ]
        
        # Append history if provided
        if request.history:
            for msg in request.history:
                role = msg.get("role")
                content = msg.get("content")
                if role in ["user", "assistant", "system"] and content:
                    messages.append({"role": role, "content": content})
                    
        # Append current user message
        messages.append({"role": "user", "content": request.message})
        
        async with httpx.AsyncClient() as httpx_client:
            response = await httpx_client.post(
                f"{ollama_host}/api/chat",
                json={
                    "model": ollama_model,
                    "messages": messages,
                    "stream": False
                },
                timeout=45.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama returned status code {response.status_code}: {response.text}")
            
            res_data = response.json()
            reply = res_data["message"]["content"]
            
            return {
                "reply": reply
            }

    except Exception as e:
        print("CHATBOT ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )