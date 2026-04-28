import asyncio
import httpx
import jwt
from uuid import uuid4
from app.config import settings

def create_service_token():
    payload = {
        "iss": settings.service_jwt_issuer,
        "sub": "chat-service",
    }
    token = jwt.encode(payload, settings.service_jwt_secret, algorithm=settings.service_jwt_algorithm)
    return token

async def test_ask():
    token = create_service_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    tenant_id = str(uuid4())
    collection_id = str(uuid4()) # Mặc định dummy, có thể sẽ không trả về citations nếu collection_id không có data
    
    payload = {
        "tenant_id": tenant_id,
        "collection_id": collection_id,
        "question": "Xin chào, bạn có thể giúp gì cho tôi?"
    }
    
    url = f"http://localhost:{settings.app_port}/v1/rag/ask"
    print(f"Gửi request tới: {url}")
    print(f"Payload: {payload}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=60.0)
        
    print(f"\nStatus Code: {response.status_code}")
    print("Response JSON:")
    try:
        import json
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)

if __name__ == "__main__":
    asyncio.run(test_ask())
