from typing import Union, List
import os
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import pathlib

import asyncio
from .meta_prompting_agent import MetaPromptingAgent

# Load environment variables from .env file
# Try to load from current directory and parent directory
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-3.5-turbo"


class FeedbackRequest(BaseModel):
    user_input: str
    assistant_response: str
    user_feedback: str = None



@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.post("/api/chat")
async def create_chat_completion(request: ChatRequest):
    try:
        print(request.messages)

        # Convert our messages to the format expected by OpenAI
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Create a streaming response
        stream = client.chat.completions.create(
            model=request.model,
            messages=openai_messages,
            stream=True
        )
        
        async def generate():
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    # Break the content into smaller chunks (individual characters)
                    for char in content:
                        yield char
                        # Add a small delay to simulate slower streaming
                        await asyncio.sleep(0.01)
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback")
async def process_feedback(request: FeedbackRequest):
    try:
        agent = MetaPromptingAgent()

        try:
            agent.load_meta_prompt()
        except:
            print("No existing meta prompt found. Starting fresh.")

        system_prompt = "You are a helpful but casual assistant. Please use short responses."
        instruction = agent.handle_feedback(last_user_input, last_assistant_response, feedback)
        response = agent.llama_chat(user_input, system_prompt, use_meta_prompt=True)

        # return 200 ?

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

