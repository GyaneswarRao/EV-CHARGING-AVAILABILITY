from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List

# Auth schemas
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "user"  # "admin" or "user"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

# Station schemas
class StationResponse(BaseModel):
    station_id: str
    city: str
    area: str
    connector_type: str
    charger_capacity_kw: int
    total_ports: int
    active_plugins: int
    queue_length: int
    avg_energy_drawn_kwh: float
    avg_dwell_time_min: int
    tariff_rate_inr: float
    temperature_c: int
    weather: str
    nearby_event: int
    current_status: str
    total_observations: Optional[int] = 1
    latitude: float
    longitude: float
    is_verified: bool = True
    is_approximate: bool = False

# Prediction schemas
class PredictionRequest(BaseModel):
    station_id: Optional[str] = "EV_SAMPLE_001"
    City: str
    Connector_Type: str
    Is_Weekend: int = 0
    Charger_Capacity_kW: int
    Total_Ports: int
    Active_Plugins: int
    Queue_Length: int
    Avg_Energy_Drawn_kWh: float
    Avg_Dwell_Time_Min: int
    Tariff_Rate_INR: float
    Temperature_C: int
    Weather: str
    Nearby_Event: int = 0
    model: Optional[str] = "Random Forest"

class PredictionResponse(BaseModel):
    station_id: str
    predicted_status: str
    probabilities: Dict[str, float]
    model: str
    timestamp: str
    prediction_id: Optional[str] = None
    input_features: Optional[Dict[str, Any]] = None

# Station status summary
class StatusSummary(BaseModel):
    total_stations: int
    available_stations: int
    busy_stations: int
    fully_congested_stations: int
    total_ports: int
    active_plugins: int
    avg_queue_length: float
    overall_utilization_pct: float
