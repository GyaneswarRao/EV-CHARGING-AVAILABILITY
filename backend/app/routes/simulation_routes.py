import asyncio
import json
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pymongo.database import Database
from app.database.connection import get_database

logger = logging.getLogger("ev_charge.simulation")
router = APIRouter(prefix="/simulation", tags=["Real-time Simulation"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

sim_manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time station operational updates.
    Broadcasts simulation events and receives client messages.
    """
    await sim_manager.connect(websocket)
    try:
        # Send initial confirmation
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to EV Charge Real-time Simulation Feed (Telemetry / IoT simulation mode)"
        }))
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming simulated telemetry
            try:
                payload = json.loads(data)
                if payload.get("action") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        sim_manager.disconnect(websocket)

@router.post("/trigger-update")
async def trigger_simulated_update(station_id: str, active_plugins: int, queue_length: int, db: Database = Depends(get_database)):
    """
    Simulates incoming telemetry update from IoT sensor / OCPI protocol.
    Updates MongoDB station record and broadcasts to connected clients.
    """
    station = db.stations.find_one({"station_id": station_id})
    if not station:
        return {"error": "Station not found"}

    total_ports = station.get("total_ports", 6)
    
    # Calculate status based on operational logic
    if queue_length > 3 or (active_plugins >= total_ports and queue_length >= 2):
        new_status = "Fully Congested"
    elif active_plugins >= int(total_ports * 0.5) or queue_length > 0:
        new_status = "Busy"
    else:
        new_status = "Available"

    db.stations.update_one(
        {"station_id": station_id},
        {"$set": {
            "active_plugins": active_plugins,
            "queue_length": queue_length,
            "current_status": new_status
        }}
    )

    update_payload = {
        "type": "STATION_TELEMETRY_UPDATE",
        "station_id": station_id,
        "active_plugins": active_plugins,
        "queue_length": queue_length,
        "current_status": new_status,
        "is_simulated": True
    }
    await sim_manager.broadcast(update_payload)
    return update_payload
