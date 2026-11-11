import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    'Is_Weekend', 'City', 'Connector_Type', 'Charger_Capacity_kW',
    'Total_Ports', 'Active_Plugins', 'Queue_Length', 'Avg_Energy_Drawn_kWh',
    'Avg_Dwell_Time_Min', 'Tariff_Rate_INR', 'Temperature_C', 'Weather',
    'Nearby_Event'
]

CATEGORICAL_COLUMNS = ['City', 'Connector_Type', 'Weather']

EXPECTED_ENCODED_COLUMNS = [
    'Is_Weekend', 'Charger_Capacity_kW', 'Total_Ports', 'Active_Plugins',
    'Queue_Length', 'Avg_Energy_Drawn_kWh', 'Avg_Dwell_Time_Min',
    'Tariff_Rate_INR', 'Temperature_C', 'Nearby_Event',
    'City_Mumbai', 'City_Nagpur', 'City_Nashik', 'City_Pune', 'City_Thane',
    'Connector_Type_CCS2', 'Connector_Type_CHAdeMO', 'Connector_Type_GB/T', 'Connector_Type_Type 2',
    'Weather_Clear', 'Weather_Cloudy', 'Weather_Hot/Humid', 'Weather_Rainy'
]

def preprocess_features(df: pd.DataFrame, expected_columns: List[str] = EXPECTED_ENCODED_COLUMNS) -> pd.DataFrame:
    """
    Applies one-hot encoding to City, Connector_Type, and Weather,
    then aligns/reindexes columns to guarantee exact match with model training schema.
    """
    # Ensure expected input columns exist
    df_clean = df[FEATURE_COLUMNS].copy()
    
    # Cast numericals
    num_cols = ['Is_Weekend', 'Charger_Capacity_kW', 'Total_Ports', 'Active_Plugins',
                'Queue_Length', 'Avg_Energy_Drawn_kWh', 'Avg_Dwell_Time_Min',
                'Tariff_Rate_INR', 'Temperature_C', 'Nearby_Event']
    for col in num_cols:
        df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0)

    # One-hot encode
    df_encoded = pd.get_dummies(df_clean, columns=CATEGORICAL_COLUMNS, drop_first=False)

    # Reindex with 0 fill to handle unseen or missing categories
    df_encoded = df_encoded.reindex(columns=expected_columns, fill_value=0)
    return df_encoded
