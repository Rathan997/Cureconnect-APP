from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import httpx

load_dotenv()

router = APIRouter()

# Get provider: 'groq' or 'ollama'
CHATBOT_PROVIDER = os.getenv("CHATBOT_PROVIDER", "groq").lower()

client = None
if CHATBOT_PROVIDER == "groq":
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY")
    )

class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        if CHATBOT_PROVIDER == "ollama":
            ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
            ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
            
            async with httpx.AsyncClient() as httpx_client:
                response = await httpx_client.post(
                    f"{ollama_host}/api/chat",
                    json={
                        "model": ollama_model,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are CureConnect AI, "
                                    "a helpful healthcare assistant. "
                                    "Give short, safe medical guidance."
                                )
                            },
                            {
                                "role": "user",
                                "content": request.message
                            }
                        ],
                        "stream": False
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Ollama returned status code {response.status_code}: {response.text}")
                
                res_data = response.json()
                reply = res_data["message"]["content"]
                
                return {
                    "reply": reply
                }
        else:
            # Default to Groq
            if not client:
                raise Exception("Groq client not initialized. Check GROQ_API_KEY.")
                
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are CureConnect AI, "
                            "a helpful healthcare assistant. "
                            "Give short, safe medical guidance."
                        )
                    },
                    {
                        "role": "user",
                        "content": request.message
                    }
                ]
            )

            reply = completion.choices[0].message.content

            return {
                "reply": reply
            }

    except Exception as e:
        print("CHATBOT ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )