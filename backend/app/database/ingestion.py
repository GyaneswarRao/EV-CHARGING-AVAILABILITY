import os
import logging
import pandas as pd
from pymongo.database import Database
from app.utils.geocoding import get_coordinates

logger = logging.getLogger("ev_charge.ingestion")

EXPECTED_COLUMNS = [
    "Date", "Time", "Day_of_Week", "Is_Weekend", "City", "Area",
    "Station_ID", "Connector_Type", "Charger_Capacity_kW", "Total_Ports",
    "Active_Plugins", "Queue_Length", "Avg_Energy_Drawn_kWh", "Avg_Dwell_Time_Min",
    "Tariff_Rate_INR", "Temperature_C", "Weather", "Nearby_Event", "Station_Status"
]

def clean_and_validate_dataset(csv_path: str) -> pd.DataFrame:
    """Read CSV, validate columns and types, detect missing/duplicates, clean data."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at: {csv_path}")

    df = pd.read_csv(csv_path)

    # 1. Column verification
    missing_cols = set(EXPECTED_COLUMNS) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Uploaded CSV missing required columns: {missing_cols}")

    # 2. Duplicate detection
    duplicates_count = df.duplicated().sum()
    if duplicates_count > 0:
        logger.info("Found %d duplicate rows. Removing duplicates.", duplicates_count)
        df = df.drop_duplicates().reset_index(drop=True)

    # 3. Data type casting and cleaning
    df["Is_Weekend"] = df["Is_Weekend"].astype(int)
    df["Charger_Capacity_kW"] = df["Charger_Capacity_kW"].astype(int)
    df["Total_Ports"] = df["Total_Ports"].astype(int)
    df["Active_Plugins"] = df["Active_Plugins"].astype(int)
    df["Queue_Length"] = df["Queue_Length"].astype(int)
    df["Avg_Energy_Drawn_kWh"] = df["Avg_Energy_Drawn_kWh"].astype(float)
    df["Avg_Dwell_Time_Min"] = df["Avg_Dwell_Time_Min"].astype(int)
    df["Tariff_Rate_INR"] = df["Tariff_Rate_INR"].astype(float)
    df["Temperature_C"] = df["Temperature_C"].astype(int)
    df["Nearby_Event"] = df["Nearby_Event"].astype(int)

    for text_col in ["Date", "Time", "Day_of_Week", "City", "Area", "Station_ID", "Connector_Type", "Weather", "Station_Status"]:
        df[text_col] = df[text_col].astype(str).str.strip()

    # 4. Null value imputation (if any numerical nulls exist)
    num_cols = ["Avg_Energy_Drawn_kWh", "Avg_Dwell_Time_Min", "Tariff_Rate_INR"]
    for col in num_cols:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)

    return df

def ingest_dataset_into_mongodb(csv_path: str, db: Database, reset: bool = False):
    """
    Ingests cleaned records into `ev_records` and creates/updates aggregated `stations` documents.
    """
    df = clean_and_validate_dataset(csv_path)

    if reset:
        db.ev_records.drop()
        db.stations.drop()
        logger.info("Dropped existing ev_records and stations collections.")

    # Convert records to dictionary for MongoDB
    records = df.to_dict(orient="records")
    if records:
        db.ev_records.insert_many(records)
        logger.info("Inserted %d operational records into 'ev_records'.", len(records))

    # Build unique station documents with geocoding, latest status, and metrics
    # Sort by Date + Time so the last row for each station represents the latest state
    df_sorted = df.sort_values(by=["Date", "Time"])
    station_groups = df_sorted.groupby("Station_ID")

    stations_to_upsert = []
    for station_id, group in station_groups:
        latest = group.iloc[-1]
        coords = get_coordinates(latest["City"], latest["Area"], station_id)

        station_doc = {
            "station_id": station_id,
            "city": latest["City"],
            "area": latest["Area"],
            "connector_type": latest["Connector_Type"],
            "charger_capacity_kw": int(latest["Charger_Capacity_kW"]),
            "total_ports": int(latest["Total_Ports"]),
            "active_plugins": int(latest["Active_Plugins"]),
            "queue_length": int(latest["Queue_Length"]),
            "avg_energy_drawn_kwh": float(latest["Avg_Energy_Drawn_kWh"]),
            "avg_dwell_time_min": int(latest["Avg_Dwell_Time_Min"]),
            "tariff_rate_inr": float(latest["Tariff_Rate_INR"]),
            "temperature_c": int(latest["Temperature_C"]),
            "weather": latest["Weather"],
            "nearby_event": int(latest["Nearby_Event"]),
            "current_status": latest["Station_Status"],
            "total_observations": int(len(group)),
            "latitude": coords["lat"],
            "longitude": coords["lng"],
            "is_verified": coords["is_verified"],
            "is_approximate": coords["is_approximate"]
        }
        stations_to_upsert.append(station_doc)

    for st in stations_to_upsert:
        db.stations.update_one(
            {"station_id": st["station_id"]},
            {"$set": st},
            upsert=True
        )

    logger.info("Upserted %d unique stations into 'stations' collection.", len(stations_to_upsert))
    return len(records), len(stations_to_upsert)
