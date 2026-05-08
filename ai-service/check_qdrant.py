import httpx
import json

async def check_qdrant():
    url = "http://localhost:6333/collections/8c719382-7220-4c54-8bed-5529d71d0d1b/points/scroll"
    payload = {"limit": 3, "with_payload": True}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        points = response.json()['result']['points']
        for p in points:
            print(f"Point ID: {p['id']}")
            print(f"Tenant ID in payload: {p['payload'].get('tenant_id')}")
            print(f"Collection ID in payload: {p['payload'].get('collection_id')}")
            print("-" * 20)

if __name__ == "__main__":
    import asyncio
    asyncio.run(check_qdrant())
