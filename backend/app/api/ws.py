from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps exam_id -> list of active WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.active_connections:
            self.active_connections[exam_id] = []
        self.active_connections[exam_id].append(websocket)
        logger.info(f"WebSocket Client connected to exam {exam_id}. Total: {len(self.active_connections[exam_id])}")

    def disconnect(self, websocket: WebSocket, exam_id: int):
        if exam_id in self.active_connections:
            if websocket in self.active_connections[exam_id]:
                self.active_connections[exam_id].remove(websocket)
            if not self.active_connections[exam_id]:
                del self.active_connections[exam_id]

    async def broadcast_to_exam(self, exam_id: int, message: dict):
        if exam_id in self.active_connections:
            payload = json.dumps(message)
            disconnected = []
            for connection in self.active_connections[exam_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.append(connection)
            
            for d in disconnected:
                self.disconnect(d, exam_id)

manager = ConnectionManager()

@router.websocket("/ws/live-exam/{exam_id}")
async def websocket_endpoint(websocket: WebSocket, exam_id: int):
    await manager.connect(websocket, exam_id)
    try:
        while True:
            # We don't necessarily need to process inbound ws messages from clients yet,
            # but we need this loop to keep the connection open.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, exam_id)
