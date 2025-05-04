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
from sentence_transformers import SentenceTransformer, util
import faiss
import json
import uuid

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

client = OpenAI(
    api_key=os.environ.get("LLAMA_API_KEY"),
    base_url="https://api.llama.com/compat/v1/"
)

# Initialize embedder for semantic search
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Define semantic intents for feedback classification
POSITIVE_SEMANTIC_INTENTS = [
    "that fixed it",
    "it's working now",
    "solved it",
    "thanks, it works",
    "no more errors",
    "this helped",
    "it runs correctly",
    "you nailed it"
]

NEGATIVE_SEMANTIC_INTENTS = [
    "It's still broken",
    "Now I get a different error",
    "Still doesn't work",
    "I'm getting a traceback",
    "Why is it failing?",
    "It crashes",
    "SyntaxError",
    "This gives an exception",
    "I get an error"
]


# File to store chat sessions
SESSIONS_FILE = "session_memory.json"

# Initialize or load session memory
def load_session_memory():
    try:
        if os.path.exists(SESSIONS_FILE):
            with open(SESSIONS_FILE, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading session memory: {e}")
        return []

def save_session_memory(sessions):
    try:
        with open(SESSIONS_FILE, 'w') as f:
            json.dump(sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving session memory: {e}")


# Load session memory
session_memory = load_session_memory()


# Initialize FAISS index
def initialize_index():
    if not session_memory:
        # Return dummy index if no sessions exist yet
        dummy_dim = 384  # Default dimension for all-MiniLM-L6-v2
        index = faiss.IndexFlatL2(dummy_dim)
        return index, []
    
    questions = [s["initial_question"] for s in session_memory]
    embeddings = embedder.encode(questions)
    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(embeddings)
    return index, embeddings

# Initialize index
index, embeddings = initialize_index()

# Models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-3.5-turbo"
    session_id: str = None

class EndSessionRequest(BaseModel):
    session_id: str
    final_code: str = ""

# Active sessions storage
active_sessions = {}

def is_negative_feedback(user_query):
    # Return True if the user's question implies failure, error, or confusion
    query_emb = embedder.encode(user_query, convert_to_tensor=True)
    example_embs = embedder.encode(NEGATIVE_SEMANTIC_INTENTS, convert_to_tensor=True)
    similarity = util.cos_sim(query_emb, example_embs)
    return similarity.max() > 0.6

def is_positive_feedback(user_query):
    query_emb = embedder.encode(user_query, convert_to_tensor=True)
    examples = embedder.encode(POSITIVE_SEMANTIC_INTENTS, convert_to_tensor=True)
    similarity = util.cos_sim(query_emb, examples)
    return similarity.max() > 0.6

def session_outcome(session):
    error_count = sum(1 for turn in session["question_chain"] if is_negative_feedback(turn["q"]))
    
    if not session["question_chain"]:
        return "Unknown", False, 0
        
    last_q = session["question_chain"][-1]["q"]

    if is_positive_feedback(last_q):
        final_output = "Success"
        tests_passed = True
    elif error_count > 0:
        final_output = "Error"
        tests_passed = False
    else:
        final_output = "Unknown"
        tests_passed = False

    return final_output, tests_passed, error_count

def reward(session):
    final_output, tests_passed, error_count = session_outcome(session)
    session["final_output"] = final_output
    session["tests_passed"] = tests_passed
    session["error_count"] = error_count
    session["chain_length"] = len(session["question_chain"])

    if tests_passed:
        return 1.0
    elif error_count > 0:
        return -0.5
    elif session["chain_length"] > 10:
        return -0.3
    else:
        return 0.0

def find_best_chain(query):
    global index, session_memory
    
    if not session_memory:
        return None
        
    query_vec = embedder.encode([query])
    k = min(5, len(session_memory))  # Ensure k is not larger than the number of sessions
    if k == 0:
        return None
        
    D, I = index.search(query_vec, k)
    top_sessions = sorted([session_memory[i] for i in I[0]], key=lambda s: -s.get("score", -999))
    return top_sessions[0] if top_sessions else None

def build_prompt_from_chain(chain, new_question):
    if not chain:
        return new_question
        
    chat_log = "\n".join([f"Q: {turn['q']}\nA: {turn['a']}" for turn in chain["question_chain"]])
    return f"""Previously, a user had a similar problem. Here's how they solved it:

            {chat_log}

            Final working code:
            {chain['final_code']}

            Now answer this new question:
            {new_question}
            """

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/api/chat")
async def create_chat_completion(request: ChatRequest):

    try:
        session_id = request.session_id
        
        # Get user's message
        user_messages = [msg for msg in request.messages if msg.role == "user"]
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user message found")
            
        current_question = user_messages[-1].content
        
        # Initialize or update session
        if session_id not in active_sessions:
            active_sessions[session_id] = {
                "session_id": session_id,
                "initial_question": current_question,
                "question_chain": [],
                "final_code": ""
            }
            
        # Look for a similar successful chain
        best_chain = find_best_chain(current_question)
        
        # Prepare messages for the API call
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Create a streaming response
        stream = client.chat.completions.create(
            model='Llama-4-Maverick-17B-128E-Instruct-FP8',
            messages=openai_messages,
            stream=True
        )
        
        # Collect the full response
        full_response = ""
        
        async def generate():
            nonlocal full_response
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    # Break the content into smaller chunks (individual characters)
                    for char in content:
                        yield char
                        # Add a small delay to simulate slower streaming
                        await asyncio.sleep(0.01)
            
            # Store the Q&A pair in the active session after full response is generated
            active_sessions[session_id]["question_chain"].append({
                "q": current_question,
                "a": full_response
            })
        
        return StreamingResponse(generate(), media_type="text/event-stream", headers={"X-Session-ID": session_id})
    
    except Exception as e:
        print("Error: ", e)
        print("Stack trace: ", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/end-session")
async def end_session(request: EndSessionRequest):
    try:
        session_id = request.session_id
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get the session
        session = active_sessions[session_id]
        
        # Add final code if provided
        if request.final_code:
            session["final_code"] = request.final_code
        
        # Calculate reward
        session["score"] = reward(session)
        
        # Add to session memory
        session_memory.append(session)
        
        # Save updated session memory
        save_session_memory(session_memory)
        
        # Rebuild index
        global index, embeddings
        questions = [s["initial_question"] for s in session_memory]
        embeddings = embedder.encode(questions)
        index = faiss.IndexFlatL2(len(embeddings[0]))
        index.add(embeddings)
        
        # Clean up the active session
        del active_sessions[session_id]
        
        return {"status": "success", "score": session["score"], "outcome": session["final_output"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))