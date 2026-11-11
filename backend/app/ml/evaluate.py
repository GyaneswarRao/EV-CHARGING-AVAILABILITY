import os
import joblib
from app.config.settings import settings
from app.ml.train_model import MODEL_METRICS_FILE

def get_model_evaluation_metrics() -> dict:
    metrics_path = os.path.join(settings.MODEL_DIR, MODEL_METRICS_FILE)
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    return {}
