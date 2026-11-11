import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pymongo.database import Database

from app.database.connection import get_database
from app.database.ingestion import ingest_dataset_into_mongodb
from app.routes.auth_routes import get_current_admin
from app.config.settings import settings

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users")
def get_all_users(current_admin: dict = Depends(get_current_admin), db: Database = Depends(get_database)):
    users = list(db.users.find({}, {"password_hash": 0}))
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
    return users

@router.get("/records")
def get_operational_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_database)
):
    total = db.ev_records.count_documents({})
    records = list(db.ev_records.find({}, {"_id": 0}).skip(skip).limit(limit))
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "records": records
    }

@router.post("/upload-dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    reset_existing: bool = Query(False),
    current_admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_database)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    upload_path = os.path.join(os.path.dirname(settings.DATASET_PATH), f"uploaded_{file.filename}")
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        records_count, stations_count = ingest_dataset_into_mongodb(upload_path, db, reset=reset_existing)
        return {
            "message": "Dataset uploaded and ingested successfully.",
            "records_ingested": records_count,
            "stations_updated": stations_count,
            "file": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error in uploaded dataset: {str(e)}")

@router.get("/logs")
def get_admin_logs(
    limit: int = Query(100, ge=1, le=500),
    current_admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_database)
):
    logs = list(db.prediction_logs.find().sort("timestamp", -1).limit(limit))
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs
