import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-page">
      <!-- Hero Section -->
      <header class="hero-section">
        <div class="container hero-container">
          <div class="hero-content">
            <div class="badge-pill">
              <span class="pulsing-dot"></span>
              Live ML Availability Intelligence & Grid Analytics
            </div>
            <h1 class="hero-title">
              Smart EV Station <span class="gradient-text">Availability & Demand</span> Predictor
            </h1>
            <p class="hero-subtitle">
              Eliminate charging congestion and range anxiety across Maharashtra. 
              Powered by high-precision Random Forest & Logistic Regression ensembles and real-time MongoDB operational telemetry.
            </p>
            <div class="hero-cta-group" *ngIf="auth.isAuthenticated">
              <a routerLink="/dashboard" class="btn btn-hero-primary">
                <span>Go to Live Dashboard</span>
                <span class="btn-arrow">→</span>
              </a>
              <a routerLink="/stations" class="btn btn-hero-secondary">
                <span>Explore Stations</span>
              </a>
              <a routerLink="/predict" class="btn btn-hero-ghost">
                <span>Try AI Prediction</span>
              </a>
            </div>

            <div class="hero-cta-group" *ngIf="!auth.isAuthenticated">
              <a routerLink="/auth/login" class="btn btn-hero-primary">
                <span>Sign In to Access Platform</span>
                <span class="btn-arrow">→</span>
              </a>
              <a routerLink="/auth/register" class="btn btn-hero-secondary">
                <span>Create Free Account</span>
              </a>
            </div>

            <div class="demo-badge-banner" *ngIf="!auth.isAuthenticated">
              <span class="demo-pill">Quick Demo</span>
              <span>Sign in with <strong>admin&#64;evcharge.com</strong> to explore stations, maps & ML predictions.</span>
            </div>

            <div class="stats-counter-strip">
              <div class="stat-item">
                <span class="stat-number">100</span>
                <span class="stat-label">Active Charging Hubs</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">5</span>
                <span class="stat-label">Smart Cities</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">96.7%</span>
                <span class="stat-label">Classification Accuracy</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">&lt; 15ms</span>
                <span class="stat-label">Inference Latency</span>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="interactive-preview-card">
              <div class="card-header">
                <div class="status-indicator">
                  <span class="dot available"></span>
                  <span>Station EV_MUM_108 • Bandra Hub</span>
                </div>
                <span class="model-tag">Random Forest (300 Trees)</span>
              </div>
              <div class="card-body">
                <div class="prediction-highlight">
                  <div class="status-badge available-badge">Available (82.3% Confidence)</div>
                  <div class="specs-grid">
                    <div class="spec-cell">
                      <span class="spec-label">Queue Length</span>
                      <span class="spec-val">0 EVs</span>
                    </div>
                    <div class="spec-cell">
                      <span class="spec-label">Active Ports</span>
                      <span class="spec-val">3 / 6 Occupied</span>
                    </div>
                    <div class="spec-cell">
                      <span class="spec-label">Capacity</span>
                      <span class="spec-val">50 kW Fast</span>
                    </div>
                    <div class="spec-cell">
                      <span class="spec-label">Tariff</span>
                      <span class="spec-val">₹17.47 / kWh</span>
                    </div>
                  </div>
                </div>

                <div class="prob-breakdown">
                  <div class="prob-title">Ensemble Probability Distribution</div>
                  <div class="prob-bar-container">
                    <div class="prob-fill avail" style="width: 82.3%"></div>
                    <div class="prob-fill busy" style="width: 17.7%"></div>
                  </div>
                  <div class="prob-legend">
                    <span><i class="dot-sm avail"></i> Available: 82.3%</span>
                    <span><i class="dot-sm busy"></i> Busy: 17.7%</span>
                    <span><i class="dot-sm cong"></i> Congested: 0.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- How It Works Section -->
      <section class="section how-it-works">
        <div class="container">
          <div class="section-header text-center">
            <span class="section-badge">Architecture & Pipeline</span>
            <h2 class="section-title">How EV Charge Predicts Station Availability</h2>
            <p class="section-desc">From hardware port connections to multi-class machine learning inference</p>
          </div>

          <div class="steps-grid">
            <div class="step-card">
              <div class="step-icon">📡</div>
              <div class="step-num">01</div>
              <h3>Operational Ingestion</h3>
              <p>Continuous recording of active plugins, waiting queue length, dwell times, power draws, and weather parameters into MongoDB.</p>
            </div>
            <div class="step-card">
              <div class="step-icon">⚙️</div>
              <div class="step-num">02</div>
              <h3>Encoding & Normalization</h3>
              <p>One-hot encoding for cities, connector protocols (CCS2, CHAdeMO, GB/T, Type 2), and standard scaling of energy metrics.</p>
            </div>
            <div class="step-card">
              <div class="step-icon">🧠</div>
              <div class="step-num">03</div>
              <h3>Dual Model Inference</h3>
              <p>Random Forest (300 estimators) captures non-linear port load dynamics, compared side-by-side with calibrated Logistic Regression.</p>
            </div>
            <div class="step-card">
              <div class="step-icon">🎯</div>
              <div class="step-num">04</div>
              <h3>Real-Time Delivery</h3>
              <p>Instant visual feedback, interactive Leaflet geo-mapping, and proactive routing for EV drivers and smart grid administrators.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Features Section -->
      <section class="section features-section">
        <div class="container">
          <div class="section-header text-center">
            <span class="section-badge">Platform Capabilities</span>
            <h2 class="section-title">Built for Real-World EV Infrastructure</h2>
          </div>

          <div class="features-grid">
            <div class="feature-card">
              <div class="f-icon">🗺️</div>
              <h4>Interactive Geospatial Map</h4>
              <p>Filter stations across Mumbai, Pune, Nagpur, Nashik, and Thane with color-coded status pins and instant popups.</p>
            </div>
            <div class="feature-card">
              <div class="f-icon">🔮</div>
              <h4>What-If Availability Simulator</h4>
              <p>Input customized charger loads, weather conditions, or local events to predict congestion before setting off.</p>
            </div>
            <div class="feature-card">
              <div class="f-icon">📊</div>
              <h4>Demand & Congestion Analytics</h4>
              <p>Inspect peak charging hours, weekend vs weekday dynamics, weather impacts, and tariff comparisons.</p>
            </div>
            <div class="feature-card">
              <div class="f-icon">🔬</div>
              <h4>Model Performance Verification</h4>
              <p>Inspect actual confusion matrices, feature importance rankings, and precision/recall metrics directly from Scikit-Learn.</p>
            </div>
            <div class="feature-card">
              <div class="f-icon">⚡</div>
              <h4>Simulated IoT Telemetry</h4>
              <p>WebSocket streaming emulation mimics live hardware sensors and OCPI 2.2 charging point protocol updates.</p>
            </div>
            <div class="feature-card">
              <div class="f-icon">🛡️</div>
              <h4>Role-Based Administration</h4>
              <p>Admin controls to manage registered accounts, upload updated CSV telemetry, and trigger automated model retraining.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container footer-content">
          <div class="footer-brand">
            <div class="footer-logo">⚡ EV CHARGE</div>
            <p>Real-Time EV Charging Station Availability & Demand Predictor Platform</p>
            <p class="copyright">Developed by Gyaneswar Rao • B.Tech CSE (CSE494 Capstone Architecture)</p>
          </div>
          <div class="footer-links">
            <div class="link-col" *ngIf="auth.isAuthenticated">
              <h5>Navigation</h5>
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/stations">Station Explorer</a>
              <a routerLink="/map">Live Map</a>
              <a routerLink="/predict">AI Predictor</a>
            </div>
            <div class="link-col" *ngIf="!auth.isAuthenticated">
              <h5>Platform Access</h5>
              <a routerLink="/auth/login">Sign In</a>
              <a routerLink="/auth/register">Create Account</a>
            </div>
            <div class="link-col">
              <h5>Technology</h5>
              <span>Angular 17</span>
              <span>FastAPI & Python</span>
              <span>MongoDB (ev_charging_db)</span>
              <span>Random Forest ML</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      background: #f8fafc;
      min-height: 100vh;
      color: #0f172a;
    }
    .container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .hero-section {
      padding: 5rem 0 4rem;
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 3rem;
      align-items: center;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .pulsing-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .hero-title {
      font-size: 3.25rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
      color: #0f172a;
    }
    .gradient-text {
      background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 2rem;
      max-width: 600px;
    }
    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 3rem;
    }
    .btn {
      padding: 0.85rem 1.75rem;
      border-radius: 0.625rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-hero-primary {
      background: #10b981;
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .btn-hero-primary:hover {
      background: #059669;
      transform: translateY(-2px);
    }
    .btn-hero-secondary {
      background: #0f172a;
      color: white;
    }
    .btn-hero-secondary:hover {
      background: #1e293b;
      transform: translateY(-2px);
    }
    .btn-hero-ghost {
      background: white;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    .btn-hero-ghost:hover {
      background: #f1f5f9;
    }
    .stats-counter-strip {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-number {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }
    .stat-divider {
      width: 1px;
      height: 2.25rem;
      background: #cbd5e1;
    }
    .interactive-preview-card {
      background: white;
      border-radius: 1.25rem;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .dot {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
    }
    .dot.available { background: #10b981; }
    .model-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .status-badge {
      padding: 0.65rem 1rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 1.05rem;
      text-align: center;
      margin-bottom: 1.25rem;
    }
    .available-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .spec-cell {
      background: #f8fafc;
      padding: 0.65rem;
      border-radius: 0.5rem;
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
    }
    .spec-label {
      font-size: 0.75rem;
      color: #64748b;
    }
    .spec-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }
    .prob-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .prob-bar-container {
      height: 0.75rem;
      border-radius: 9999px;
      background: #e2e8f0;
      display: flex;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    .prob-fill.avail { background: #10b981; }
    .prob-fill.busy { background: #f59e0b; }
    .prob-fill.cong { background: #ef4444; }
    .prob-legend {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
    .dot-sm {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-right: 0.25rem;
    }
    .dot-sm.avail { background: #10b981; }
    .dot-sm.busy { background: #f59e0b; }
    .dot-sm.cong { background: #ef4444; }

    .section {
      padding: 5rem 0;
    }
    .section-header {
      margin-bottom: 3.5rem;
    }
    .text-center { text-align: center; }
    .section-badge {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #059669;
      margin-bottom: 0.5rem;
    }
    .section-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 0.75rem;
    }
    .section-desc {
      color: #64748b;
      font-size: 1.1rem;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .step-card {
      background: white;
      padding: 2rem 1.5rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      position: relative;
    }
    .step-icon {
      font-size: 2.25rem;
      margin-bottom: 1rem;
    }
    .step-num {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      font-size: 1.5rem;
      font-weight: 800;
      color: #e2e8f0;
    }
    .step-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .step-card p {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
    }

    .features-section {
      background: white;
      border-top: 1px solid #e2e8f0;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.75rem;
    }
    .feature-card {
      padding: 1.75rem;
      border-radius: 0.875rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .f-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .feature-card h4 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .feature-card p {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
    }

    .footer {
      background: #0f172a;
      color: #cbd5e1;
      padding: 4rem 0 3rem;
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      gap: 3rem;
      flex-wrap: wrap;
    }
    .footer-logo {
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.75rem;
    }
    .copyright {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 1rem;
    }
    .footer-links {
      display: flex;
      gap: 4rem;
    }
    .link-col h5 {
      color: white;
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .link-col a, .link-col span {
      display: block;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .link-col a:hover {
      color: #10b981;
    }

    .demo-badge-banner {
      margin-top: 1.25rem;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      color: #475569;
    }
    .demo-pill {
      background: #10b981;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media (max-width: 1024px) {
      .hero-container { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: repeat(2, 1fr); }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .steps-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 2.25rem; }
    }
  `]
})
export class LandingComponent {
  auth = inject(AuthService);
}
