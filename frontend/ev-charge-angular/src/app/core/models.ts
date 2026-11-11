export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Station {
  station_id: string;
  city: string;
  area: string;
  connector_type: string;
  charger_capacity_kw: number;
  total_ports: number;
  active_plugins: number;
  queue_length: number;
  avg_energy_drawn_kwh: number;
  avg_dwell_time_min: number;
  tariff_rate_inr: number;
  temperature_c: number;
  weather: string;
  nearby_event: number;
  current_status: 'Available' | 'Busy' | 'Fully Congested';
  total_observations?: number;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  is_approximate: boolean;
}

export interface StatusSummary {
  total_stations: number;
  available_stations: number;
  busy_stations: number;
  fully_congested_stations: number;
  total_ports: number;
  active_plugins: number;
  avg_queue_length: number;
  overall_utilization_pct: number;
}

export interface PredictionRequest {
  station_id?: string;
  City: string;
  Connector_Type: string;
  Is_Weekend: number;
  Charger_Capacity_kW: number;
  Total_Ports: number;
  Active_Plugins: number;
  Queue_Length: number;
  Avg_Energy_Drawn_kWh: number;
  Avg_Dwell_Time_Min: number;
  Tariff_Rate_INR: number;
  Temperature_C: number;
  Weather: string;
  Nearby_Event: number;
  model?: string;
}

export interface PredictionResult {
  station_id: string;
  predicted_status: 'Available' | 'Busy' | 'Fully Congested';
  probabilities: {
    Available: number;
    Busy: number;
    'Fully Congested': number;
  };
  model: string;
  timestamp: string;
  prediction_id?: string;
  input_features?: any;
}

export interface ModelMetrics {
  classes: string[];
  sample_counts: {
    total: number;
    train: number;
    test: number;
  };
  random_forest: {
    model_name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
  };
  logistic_regression: {
    model_name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
  };
  feature_importances: { feature: string; importance: number }[];
}
