from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):
    try:

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
        print("GROQ ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )