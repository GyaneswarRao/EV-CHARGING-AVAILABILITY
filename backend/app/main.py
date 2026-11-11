import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.connection import db_manager, get_database
from app.database.ingestion import ingest_dataset_into_mongodb
from app.ml.train_model import train_and_evaluate_models
from app.ml.predict import predictor
from app.routes import auth_routes, station_routes, prediction_routes, analytics_routes, ml_routes, admin_routes, simulation_routes

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ev_charge.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EV Charge backend services...")
    db = get_database()
    
    # Check if database has records, if not auto-ingest the CSV dataset
    if db.ev_records.count_documents({}) == 0:
        logger.info("No records in MongoDB. Auto-ingesting original dataset from %s", settings.DATASET_PATH)
        ingest_dataset_into_mongodb(settings.DATASET_PATH, db, reset=False)

    # Initialize/load models
    if not predictor.load_models():
        logger.info("Training initial ML models from dataset...")
        train_and_evaluate_models(db)
        predictor.load_models()

    logger.info("EV Charge Platform initialized successfully.")
    yield
    db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time EV Charging Station Availability & Demand Predictor API using MongoDB and Machine Learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_routes.router, prefix=settings.API_V1_STR)
app.include_router(station_routes.router, prefix=settings.API_V1_STR)
app.include_router(prediction_routes.router, prefix=settings.API_V1_STR)
app.include_router(analytics_routes.router, prefix=settings.API_V1_STR)
app.include_router(ml_routes.router, prefix=settings.API_V1_STR)
app.include_router(admin_routes.router, prefix=settings.API_V1_STR)
app.include_router(simulation_routes.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "EV Charge - Real-Time EV Charging Availability & Demand Prediction Platform",
        "version": "1.0.0",
        "database": "ev_charging_db",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    db = get_database()
    return {
        "status": "healthy",
        "records_count": db.ev_records.count_documents({}),
        "stations_count": db.stations.count_documents({}),
        "models_ready": predictor.rf_model is not None and predictor.lr_model is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
