import os
import joblib
import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from pymongo.database import Database

from app.config.settings import settings
from app.ml.preprocessing import FEATURE_COLUMNS, CATEGORICAL_COLUMNS, EXPECTED_ENCODED_COLUMNS, preprocess_features

logger = logging.getLogger("ev_charge.ml_train")

MODEL_METRICS_FILE = "metrics.joblib"
RF_MODEL_FILE = "random_forest_model.joblib"
LR_MODEL_FILE = "logistic_regression_model.joblib"
SCALER_FILE = "scaler.joblib"

def train_and_evaluate_models(db: Database = None, df_input: pd.DataFrame = None) -> dict:
    """
    Trains Random Forest (300 estimators) and Logistic Regression on dataset,
    computes evaluation metrics, saves models via Joblib, and stores prediction evaluation in MongoDB.
    """
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    # 1. Load Data
    if df_input is not None:
        df = df_input.copy()
    elif db is not None and db.ev_records.count_documents({}) > 0:
        logger.info("Loading records from MongoDB 'ev_records' collection...")
        records = list(db.ev_records.find({}, {"_id": 0}))
        df = pd.DataFrame(records)
    else:
        logger.info("Loading records directly from CSV: %s", settings.DATASET_PATH)
        df = pd.read_csv(settings.DATASET_PATH)

    # 2. Extract features and target
    X_encoded = preprocess_features(df, EXPECTED_ENCODED_COLUMNS)
    y = df['Station_Status']

    # 3. Train-test split (80:20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Train Model 1: Random Forest Classifier (300 estimators)
    rf_model = RandomForestClassifier(n_estimators=300, random_state=42)
    rf_model.fit(X_train, y_train)

    # 5. Train Model 2: Logistic Regression (StandardScaler)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    lr_model = LogisticRegression(max_iter=1500, random_state=42)
    lr_model.fit(X_train_scaled, y_train)

    # 6. Evaluate Random Forest
    labels = ["Available", "Busy", "Fully Congested"]
    y_pred_rf = rf_model.predict(X_test)
    y_prob_rf = rf_model.predict_proba(X_test)

    rf_acc = float(accuracy_score(y_test, y_pred_rf))
    rf_prec = float(precision_score(y_test, y_pred_rf, average="macro", zero_division=0))
    rf_rec = float(recall_score(y_test, y_pred_rf, average="macro", zero_division=0))
    rf_f1 = float(f1_score(y_test, y_pred_rf, average="macro", zero_division=0))
    rf_cm = confusion_matrix(y_test, y_pred_rf, labels=labels).tolist()

    # 7. Evaluate Logistic Regression
    y_pred_lr = lr_model.predict(X_test_scaled)
    y_prob_lr = lr_model.predict_proba(X_test_scaled)

    lr_acc = float(accuracy_score(y_test, y_pred_lr))
    lr_prec = float(precision_score(y_test, y_pred_lr, average="macro", zero_division=0))
    lr_rec = float(recall_score(y_test, y_pred_lr, average="macro", zero_division=0))
    lr_f1 = float(f1_score(y_test, y_pred_lr, average="macro", zero_division=0))
    lr_cm = confusion_matrix(y_test, y_pred_lr, labels=labels).tolist()

    # 8. Feature Importances from Random Forest
    importances_series = pd.Series(rf_model.feature_importances_, index=EXPECTED_ENCODED_COLUMNS).sort_values(ascending=False)
    feature_importances = [{"feature": k, "importance": round(float(v), 5)} for k, v in importances_series.items()]

    # 9. Packaging metrics
    metrics = {
        "classes": labels,
        "sample_counts": {
            "total": len(df),
            "train": len(X_train),
            "test": len(X_test)
        },
        "random_forest": {
            "model_name": "Random Forest Classifier (300 estimators)",
            "accuracy": round(rf_acc, 4),
            "precision": round(rf_prec, 4),
            "recall": round(rf_rec, 4),
            "f1_score": round(rf_f1, 4),
            "confusion_matrix": rf_cm
        },
        "logistic_regression": {
            "model_name": "Logistic Regression (StandardScaler)",
            "accuracy": round(lr_acc, 4),
            "precision": round(lr_prec, 4),
            "recall": round(lr_rec, 4),
            "f1_score": round(lr_f1, 4),
            "confusion_matrix": lr_cm
        },
        "feature_importances": feature_importances,
        "encoded_columns": EXPECTED_ENCODED_COLUMNS
    }

    # 10. Save models and preprocessing objects using Joblib
    rf_path = os.path.join(settings.MODEL_DIR, RF_MODEL_FILE)
    lr_path = os.path.join(settings.MODEL_DIR, LR_MODEL_FILE)
    scaler_path = os.path.join(settings.MODEL_DIR, SCALER_FILE)
    metrics_path = os.path.join(settings.MODEL_DIR, MODEL_METRICS_FILE)

    joblib.dump(rf_model, rf_path)
    joblib.dump(lr_model, lr_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(metrics, metrics_path)
    logger.info("Successfully trained and saved all models to %s", settings.MODEL_DIR)

    # 11. Save test evaluation predictions into MongoDB ev_predictions collection
    if db is not None:
        try:
            db.ev_predictions.drop()
            test_indices = X_test.index
            eval_predictions = []
            for i, idx in enumerate(test_indices):
                orig_row = df.loc[idx]
                eval_doc = {
                    "station_id": str(orig_row.get("Station_ID", f"ST_{i}")),
                    "actual_status": str(orig_row["Station_Status"]),
                    "predicted_status_rf": str(y_pred_rf[i]),
                    "probabilities_rf": {labels[j]: round(float(y_prob_rf[i][j]) * 100, 2) for j in range(len(labels))},
                    "predicted_status_lr": str(y_pred_lr[i]),
                    "probabilities_lr": {labels[j]: round(float(y_prob_lr[i][j]) * 100, 2) for j in range(len(labels))},
                    "city": str(orig_row.get("City", "")),
                    "area": str(orig_row.get("Area", ""))
                }
                eval_predictions.append(eval_doc)
            db.ev_predictions.insert_many(eval_predictions)
            logger.info("Saved %d evaluation predictions into 'ev_predictions' collection.", len(eval_predictions))
        except Exception as e:
            logger.warning("Could not persist evaluation predictions to MongoDB: %s", e)

    return metrics
