from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database

from app.database.connection import get_database
from app.schemas.all_schemas import StationResponse, StatusSummary

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("", response_model=List[StationResponse])
def get_stations(
    city: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    connector_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None),
    sort_by: Optional[str] = Query(None),  # 'queue_asc', 'queue_desc', 'tariff_asc', 'tariff_desc'
    skip: int = Query(0, ge=0),
    limit: int = Query(150, ge=1, le=500),
    db: Database = Depends(get_database)
):
    query = {}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if area:
        query["area"] = {"$regex": f"^{area}$", "$options": "i"}
    if connector_type:
        query["connector_type"] = connector_type
    if status:
        query["current_status"] = {"$regex": f"^{status}$", "$options": "i"}
    if search:
        query["$or"] = [
            {"station_id": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"area": {"$regex": search, "$options": "i"}}
        ]
    if min_capacity:
        query["charger_capacity_kw"] = {"$gte": min_capacity}

    cursor = db.stations.find(query, {"_id": 0})

    if sort_by == "queue_asc":
        cursor = cursor.sort("queue_length", 1)
    elif sort_by == "queue_desc":
        cursor = cursor.sort("queue_length", -1)
    elif sort_by == "tariff_asc":
        cursor = cursor.sort("tariff_rate_inr", 1)
    elif sort_by == "tariff_desc":
        cursor = cursor.sort("tariff_rate_inr", -1)
    else:
        cursor = cursor.sort("station_id", 1)

    stations = list(cursor.skip(skip).limit(limit))
    return stations

@router.get("/cities")
def get_cities(db: Database = Depends(get_database)):
    """Returns all cities and their areas present in MongoDB"""
    stations = list(db.stations.find({}, {"city": 1, "area": 1, "_id": 0}))
    city_map = {}
    for st in stations:
        c = st.get("city", "")
        a = st.get("area", "")
        if c not in city_map:
            city_map[c] = set()
        if a:
            city_map[c].add(a)
    return {c: sorted(list(areas)) for c, areas in sorted(city_map.items())}

@router.get("/status-summary", response_model=StatusSummary)
def get_status_summary(db: Database = Depends(get_database)):
    stations = list(db.stations.find({}, {"_id": 0}))
    total = len(stations)
    if total == 0:
        return StatusSummary(
            total_stations=0,
            available_stations=0,
            busy_stations=0,
            fully_congested_stations=0,
            total_ports=0,
            active_plugins=0,
            avg_queue_length=0.0,
            overall_utilization_pct=0.0
        )

    avail = sum(1 for s in stations if s.get("current_status") == "Available")
    busy = sum(1 for s in stations if s.get("current_status") == "Busy")
    congested = sum(1 for s in stations if s.get("current_status") == "Fully Congested")

    tot_ports = sum(s.get("total_ports", 0) for s in stations)
    act_plugins = sum(s.get("active_plugins", 0) for s in stations)
    avg_queue = sum(s.get("queue_length", 0) for s in stations) / total
    utilization = (act_plugins / tot_ports * 100) if tot_ports > 0 else 0.0

    return StatusSummary(
        total_stations=total,
        available_stations=avail,
        busy_stations=busy,
        fully_congested_stations=congested,
        total_ports=tot_ports,
        active_plugins=act_plugins,
        avg_queue_length=round(avg_queue, 2),
        overall_utilization_pct=round(utilization, 2)
    )

@router.get("/{station_id}", response_model=StationResponse)
def get_station_by_id(station_id: str, db: Database = Depends(get_database)):
    station = db.stations.find_one({"station_id": station_id}, {"_id": 0})
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
    return station
