import logging
from pymongo import MongoClient
from pymongo.database import Database
from app.config.settings import settings

logger = logging.getLogger("ev_charge.database")

class DatabaseManager:
    client: MongoClient = None
    db: Database = None
    is_mock: bool = False

    def connect(self):
        try:
            # First attempt connection to live MongoDB server
            self.client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = False
            logger.info("Connected to live MongoDB at %s, database: %s", settings.MONGODB_URL, settings.DATABASE_NAME)
        except Exception as e:
            logger.warning("Could not connect to live MongoDB (%s). Initializing high-fidelity in-memory MongoDB fallback (mongomock).", e)
            import mongomock
            self.client = mongomock.MongoClient()
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = True
            logger.info("Initialized mongomock database: %s", settings.DATABASE_NAME)

        self._ensure_indexes()
        return self.db

    def _ensure_indexes(self):
        try:
            self.db.ev_records.create_index("Station_ID")
            self.db.ev_records.create_index("City")
            self.db.ev_records.create_index("Station_Status")
            self.db.stations.create_index("station_id", unique=True)
            self.db.users.create_index("email", unique=True)
            self.db.prediction_logs.create_index("timestamp")
        except Exception as e:
            logger.warning("Index creation note: %s", e)

    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

db_manager = DatabaseManager()

def get_database() -> Database:
    if db_manager.db is None:
        db_manager.connect()
    return db_manager.db
