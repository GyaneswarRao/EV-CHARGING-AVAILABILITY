from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pymongo.database import Database
from bson import ObjectId

from app.database.connection import get_database
from app.schemas.all_schemas import PredictionRequest, PredictionResponse
from app.ml.predict import predictor
from app.security.auth import decode_access_token

router = APIRouter(prefix="/predict", tags=["Prediction"])

def optional_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            return payload.get("sub")
    return None

@router.post("", response_model=PredictionResponse)
def predict_availability(
    request: PredictionRequest,
    user_email: Optional[str] = Depends(optional_user),
    db: Database = Depends(get_database)
):
    input_dict = request.dict()
    model_choice = input_dict.pop("model", "Random Forest")
    try:
        result = predictor.predict(
            input_data=input_dict,
            model_type=model_choice,
            user_id=user_email,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/history")
def get_prediction_history(
    user_email: Optional[str] = Depends(optional_user),
    station_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Database = Depends(get_database)
):
    query = {}
    if user_email:
        query["user_id"] = user_email
    if station_id:
        query["station_id"] = station_id

    logs = list(db.prediction_logs.find(query).sort("timestamp", -1).limit(limit))
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
    return logs

@router.get("/{prediction_id}")
def get_prediction_detail(prediction_id: str, db: Database = Depends(get_database)):
    try:
        obj_id = ObjectId(prediction_id)
        doc = db.prediction_logs.find_one({"_id": obj_id})
    except Exception:
        doc = db.prediction_logs.find_one({"prediction_id": prediction_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc
