import httpx
import json
import asyncio

async def test_ollama():
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "llama3:latest",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"}
        ],
        "stream": False
    }
    print(f"Testing Ollama at {url} with model llama3:latest...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=60.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama())
