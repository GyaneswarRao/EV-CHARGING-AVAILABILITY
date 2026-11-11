# EV CHARGE – Real-Time EV Charging Station Availability & Demand Predictor

Full-stack production-grade EV charging intelligence platform built with **Angular 17**, **FastAPI**, **MongoDB (`ev_charging_db`)**, and **Scikit-Learn Machine Learning**.

---

## 🚀 Key Highlights & Architectural Features

1. **Original Dataset Integration**:
   - Ingests and cleans `EV_Charging_Station_Dataset.csv` (450 observations across Mumbai, Pune, Nagpur, Nashik, and Thane).
   - Ingests into MongoDB collections: `ev_records`, `stations`, `users`, `ev_predictions`, `prediction_logs`.
2. **Machine Learning Pipeline**:
   - **Random Forest Classifier (300 estimators)**: captures non-linear interactions between active port ratios, queues, dwell times, and tariffs.
   - **Logistic Regression**: standardized linear baseline with `StandardScaler` for calibrated class probabilities.
   - Evaluated via Stratified 80:20 holdout test set with Precision, Recall, Macro F1, and Confusion Matrices.
3. **Interactive Angular 17 Frontend**:
   - **Landing Page**: Commercial EV SaaS branding, stats counter, architecture walkthrough.
   - **Authentication**: JWT authentication with bcrypt password hashing, role-based protection (Admin vs User).
   - **Executive Dashboard**: Network metrics, utilization %, real-time status breakdowns, 24h demand profile.
   - **Station Explorer**: Multi-facet filterable catalog by City, Locality, Connector Type, Capacity, and Sort Order.
   - **Interactive Leaflet Map**: Verified Maharashtra coordinates with color-coded availability pins.
   - **AI Availability Predictor**: What-if scenario simulator with confidence distribution bars.
   - **Analytics & Demand Hub**: Weather impacts, weekday vs weekend patterns, and tariff comparisons.
   - **Model Metrics**: Exact confusion matrices and feature importance rankings.
   - **Admin Management**: User accounts, dataset upload pipeline, and background retraining triggers.
   - **Simulated Hardware Telemetry**: WebSocket feed emulator simulating OCPI / IoT sensors without misrepresenting historical data.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 17, TypeScript, Tailwind/Clean Modern SaaS CSS, Chart.js, Leaflet.js, RxJS.
- **Backend**: Python 3.14 / 3.11, FastAPI, Pydantic, PyMongo, Uvicorn, bcrypt, python-jose, websockets.
- **Database**: MongoDB (`ev_charging_db`). High-fidelity in-memory fallback enabled if standalone MongoDB daemon is absent.
- **Machine Learning**: Scikit-learn, Pandas, NumPy, Joblib, Matplotlib, Seaborn.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🏃 Local Development Quickstart

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup
```bash
cd frontend/ev-charge-angular
npm install
npm start
```
- Access the web application at: [http://localhost:4200](http://localhost:4200)

### 3. Demo Credentials
- **Admin**: `admin@evcharge.com` / `Password123!` (or use the one-click demo login button)

---

## 🐳 Docker Deployment
To launch the complete containerized stack (MongoDB + FastAPI Backend + Angular Nginx Frontend):
```bash
docker-compose up --build -d
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- MongoDB: `localhost:27017`
