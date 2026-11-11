import os
import joblib
import logging
import pandas as pd
from datetime import datetime, timezone
from pymongo.database import Database

from app.config.settings import settings
from app.ml.preprocessing import preprocess_features, EXPECTED_ENCODED_COLUMNS
from app.ml.train_model import RF_MODEL_FILE, LR_MODEL_FILE, SCALER_FILE, MODEL_METRICS_FILE

logger = logging.getLogger("ev_charge.ml_predict")

class Predictor:
    def __init__(self):
        self.rf_model = None
        self.lr_model = None
        self.scaler = None
        self.metrics = None
        self.classes = ["Available", "Busy", "Fully Congested"]
        self.load_models()

    def load_models(self):
        rf_path = os.path.join(settings.MODEL_DIR, RF_MODEL_FILE)
        lr_path = os.path.join(settings.MODEL_DIR, LR_MODEL_FILE)
        scaler_path = os.path.join(settings.MODEL_DIR, SCALER_FILE)
        metrics_path = os.path.join(settings.MODEL_DIR, MODEL_METRICS_FILE)

        if os.path.exists(rf_path) and os.path.exists(lr_path) and os.path.exists(scaler_path):
            self.rf_model = joblib.load(rf_path)
            self.lr_model = joblib.load(lr_path)
            self.scaler = joblib.load(scaler_path)
            if os.path.exists(metrics_path):
                self.metrics = joblib.load(metrics_path)
                self.classes = self.metrics.get("classes", self.classes)
            logger.info("Successfully loaded ML models and scalers from disk.")
            return True
        else:
            logger.warning("Saved models not found in %s. Training will be required.", settings.MODEL_DIR)
            return False

    def predict(self, input_data: dict, model_type: str = "Random Forest", user_id: str = None, db: Database = None) -> dict:
        if self.rf_model is None or self.lr_model is None:
            self.load_models()
            if self.rf_model is None:
                raise RuntimeError("ML Models are not yet trained. Please trigger training first.")

        # Construct single-row DataFrame
        df_input = pd.DataFrame([input_data])
        X_encoded = preprocess_features(df_input, EXPECTED_ENCODED_COLUMNS)

        model_name_clean = "Random Forest" if "forest" in model_type.lower() else "Logistic Regression"
        
        if model_name_clean == "Random Forest":
            predicted_status = self.rf_model.predict(X_encoded)[0]
            probs_raw = self.rf_model.predict_proba(X_encoded)[0]
            classes_in_model = list(self.rf_model.classes_)
        else:
            X_scaled = self.scaler.transform(X_encoded)
            predicted_status = self.lr_model.predict(X_scaled)[0]
            probs_raw = self.lr_model.predict_proba(X_scaled)[0]
            classes_in_model = list(self.lr_model.classes_)

        # Map probabilities correctly to all known target classes
        prob_dict = {}
        for c in self.classes:
            if c in classes_in_model:
                idx = classes_in_model.index(c)
                prob_dict[c] = round(float(probs_raw[idx]) * 100, 2)
            else:
                prob_dict[c] = 0.0

        station_id = input_data.get("Station_ID") or input_data.get("station_id") or "UNKNOWN_STATION"
        timestamp = datetime.now(timezone.utc).isoformat()

        # Build response payload
        result = {
            "station_id": station_id,
            "predicted_status": str(predicted_status),
            "probabilities": prob_dict,
            "model": model_name_clean,
            "timestamp": timestamp,
            "input_features": input_data
        }

        # Store prediction in MongoDB prediction_logs collection
        if db is not None:
            try:
                log_doc = {
                    "station_id": station_id,
                    "predicted_status": str(predicted_status),
                    "probabilities": prob_dict,
                    "model": model_name_clean,
                    "timestamp": timestamp,
                    "user_id": user_id,
                    "city": input_data.get("City", ""),
                    "area": input_data.get("Area", ""),
                    "input_features": input_data
                }
                inserted = db.prediction_logs.insert_one(log_doc)
                result["prediction_id"] = str(inserted.inserted_id)
            except Exception as e:
                logger.warning("Could not log prediction to database: %s", e)

        return result

predictor = Predictor()
