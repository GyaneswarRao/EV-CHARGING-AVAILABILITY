from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pymongo.database import Database

from app.database.connection import get_database
from app.ml.train_model import train_and_evaluate_models
from app.ml.evaluate import get_model_evaluation_metrics
from app.routes.auth_routes import get_current_admin

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

training_state = {
    "is_training": False,
    "last_trained": None,
    "last_status": "Idle"
}

@router.get("/model-performance")
def get_model_performance():
    metrics = get_model_evaluation_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="Model metrics not found. Train model first.")
    return metrics

def run_background_training(db: Database):
    training_state["is_training"] = True
    training_state["last_status"] = "Training in progress..."
    try:
        metrics = train_and_evaluate_models(db)
        from app.ml.predict import predictor
        predictor.load_models()
        from datetime import datetime, timezone
        training_state["last_trained"] = datetime.now(timezone.utc).isoformat()
        training_state["last_status"] = "Successfully trained models"
    except Exception as e:
        training_state["last_status"] = f"Training failed: {str(e)}"
    finally:
        training_state["is_training"] = False

@router.post("/train")
def trigger_training(
    background_tasks: BackgroundTasks,
    current_admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_database)
):
    if training_state["is_training"]:
        return {"message": "Model training is already currently underway.", "status": training_state}

    background_tasks.add_task(run_background_training, db)
    return {"message": "Model retraining initiated in background.", "status": "Started"}

@router.get("/training-status")
def get_training_status():
    return training_state
