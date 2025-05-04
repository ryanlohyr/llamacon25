import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_client():
    client = OpenAI(
        api_key=os.getenv("LLAMA_API_KEY"),
        base_url="https://api.llama.com/compat/v1/",
    )
    return client

def llama_chat(prompt):
    response = client.chat.completions.create(
        model="Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages=[
            {"role": "user", "content": prompt},
        ],
    )
    return response


def pretty_print_response(response):
    response_dict = response.dict()
    formatted_json = json.dumps(response_dict, indent=2)
    
    print(formatted_json)




if __name__ == "__main__":
    prompt = "Hello Llama! Can you give me a quick intro?"
    response = llama_chat(prompt)
    pretty_print_response(response)
