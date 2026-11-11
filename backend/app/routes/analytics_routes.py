from fastapi import APIRouter, Depends
from pymongo.database import Database
import pandas as pd
import numpy as np

from app.database.connection import get_database
from app.ml.evaluate import get_model_evaluation_metrics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(db: Database = Depends(get_database)):
    records = list(db.ev_records.find({}, {"_id": 0}))
    if not records:
        return {}

    df = pd.DataFrame(records)
    total_records = len(df)
    status_counts = df["Station_Status"].value_counts().to_dict()
    connector_counts = df["Connector_Type"].value_counts().to_dict()
    weather_counts = df["Weather"].value_counts().to_dict()

    avg_metrics = {
        "avg_dwell_time_min": round(float(df["Avg_Dwell_Time_Min"].mean()), 1),
        "avg_energy_drawn_kwh": round(float(df["Avg_Energy_Drawn_kWh"].mean()), 2),
        "avg_tariff_inr": round(float(df["Tariff_Rate_INR"].mean()), 2),
        "avg_temperature_c": round(float(df["Temperature_C"].mean()), 1),
        "avg_queue_length": round(float(df["Queue_Length"].mean()), 2)
    }

    return {
        "total_records": total_records,
        "status_distribution": status_counts,
        "connector_distribution": connector_counts,
        "weather_distribution": weather_counts,
        "average_metrics": avg_metrics
    }

@router.get("/city-wise")
def get_city_wise_analytics(db: Database = Depends(get_database)):
    records = list(db.ev_records.find({}, {"_id": 0}))
    if not records:
        return []

    df = pd.DataFrame(records)
    city_group = df.groupby("City")
    result = []
    for city, grp in city_group:
        status_dist = grp["Station_Status"].value_counts().to_dict()
        result.append({
            "city": city,
            "total_records": len(grp),
            "unique_stations": int(grp["Station_ID"].nunique()),
            "avg_queue_length": round(float(grp["Queue_Length"].mean()), 2),
            "avg_dwell_time_min": round(float(grp["Avg_Dwell_Time_Min"].mean()), 1),
            "avg_energy_drawn_kwh": round(float(grp["Avg_Energy_Drawn_kWh"].mean()), 2),
            "avg_tariff_rate_inr": round(float(grp["Tariff_Rate_INR"].mean()), 2),
            "status_distribution": {
                "Available": int(status_dist.get("Available", 0)),
                "Busy": int(status_dist.get("Busy", 0)),
                "Fully Congested": int(status_dist.get("Fully Congested", 0))
            }
        })
    return result

@router.get("/demand")
def get_demand_analytics(db: Database = Depends(get_database)):
    records = list(db.ev_records.find({}, {"_id": 0}))
    if not records:
        return {}

    df = pd.DataFrame(records)
    
    # Weekday vs Weekend demand
    weekend_grp = df.groupby("Is_Weekend")
    weekend_comparison = {}
    for is_wknd, grp in weekend_grp:
        label = "Weekend" if is_wknd == 1 else "Weekday"
        weekend_comparison[label] = {
            "count": len(grp),
            "avg_active_plugins": round(float(grp["Active_Plugins"].mean()), 2),
            "avg_queue": round(float(grp["Queue_Length"].mean()), 2),
            "status_breakdown": grp["Station_Status"].value_counts().to_dict()
        }

    # Nearby event impact
    event_grp = df.groupby("Nearby_Event")
    event_impact = {}
    for ev_flag, grp in event_grp:
        label = "Nearby Event Active" if ev_flag == 1 else "Normal Days"
        event_impact[label] = {
            "count": len(grp),
            "avg_queue": round(float(grp["Queue_Length"].mean()), 2),
            "avg_active_plugins": round(float(grp["Active_Plugins"].mean()), 2),
            "status_breakdown": grp["Station_Status"].value_counts().to_dict()
        }

    # Weather impact
    weather_grp = df.groupby("Weather")
    weather_impact = []
    for w, grp in weather_grp:
        weather_impact.append({
            "weather": w,
            "avg_queue": round(float(grp["Queue_Length"].mean()), 2),
            "avg_energy_kwh": round(float(grp["Avg_Energy_Drawn_kWh"].mean()), 2),
            "status_distribution": grp["Station_Status"].value_counts().to_dict()
        })

    # Charger capacity analysis
    capacity_grp = df.groupby("Charger_Capacity_kW")
    capacity_analysis = []
    for cap, grp in capacity_grp:
        capacity_analysis.append({
            "capacity_kw": int(cap),
            "count": len(grp),
            "avg_dwell_time": round(float(grp["Avg_Dwell_Time_Min"].mean()), 1),
            "avg_queue": round(float(grp["Queue_Length"].mean()), 2)
        })

    return {
        "weekend_comparison": weekend_comparison,
        "event_impact": event_impact,
        "weather_impact": weather_impact,
        "capacity_analysis": sorted(capacity_analysis, key=lambda x: x["capacity_kw"])
    }

@router.get("/peak-hours")
def get_peak_hours(db: Database = Depends(get_database)):
    records = list(db.ev_records.find({}, {"_id": 0}))
    if not records:
        return []

    df = pd.DataFrame(records)
    # Extract hour from Time (HH:MM)
    df["Hour"] = df["Time"].apply(lambda t: str(t).split(":")[0].zfill(2) + ":00" if ":" in str(t) else str(t))
    
    hour_grp = df.groupby("Hour")
    hourly_stats = []
    for hr, grp in sorted(hour_grp):
        status_dist = grp["Station_Status"].value_counts().to_dict()
        hourly_stats.append({
            "hour": hr,
            "observations": len(grp),
            "avg_active_plugins": round(float(grp["Active_Plugins"].mean()), 2),
            "avg_queue": round(float(grp["Queue_Length"].mean()), 2),
            "available": int(status_dist.get("Available", 0)),
            "busy": int(status_dist.get("Busy", 0)),
            "fully_congested": int(status_dist.get("Fully Congested", 0))
        })
    return hourly_stats

@router.get("/feature-importance")
def get_feature_importance():
    metrics = get_model_evaluation_metrics()
    return metrics.get("feature_importances", [])
