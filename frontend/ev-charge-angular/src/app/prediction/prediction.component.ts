import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Station, PredictionRequest, PredictionResult } from '../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="prediction-page">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <div class="badge-tag">Machine Learning Classification Pipeline</div>
            <h1 class="page-title">AI Station Availability Predictor</h1>
            <p class="page-subtitle">Select an operational station or simulate custom parameters for real-time inference</p>
          </div>
        </div>

        <div class="prediction-layout">
          <!-- Form Panel -->
          <div class="card form-card">
            <div class="card-head">
              <h3>Inference Input Parameters</h3>
              <div class="station-loader">
                <label>Load from Station:</label>
                <select (change)="onStationSelect($event)" class="select-sm">
                  <option value="">-- Choose Existing Station --</option>
                  <option *ngFor="let s of allStations" [value]="s.station_id">
                    {{ s.station_id }} ({{ s.city }} - {{ s.area }})
                  </option>
                </select>
              </div>
            </div>

            <form (ngSubmit)="predict()" class="form-body">
              <div class="form-row">
                <div class="form-field">
                  <label>City</label>
                  <select [(ngModel)]="form.City" name="City" required class="form-ctrl">
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Thane">Thane</option>
                  </select>
                </div>

                <div class="form-field">
                  <label>Connector Type</label>
                  <select [(ngModel)]="form.Connector_Type" name="Connector_Type" required class="form-ctrl">
                    <option value="Type 2">Type 2 (AC Slow/Fast)</option>
                    <option value="CCS2">CCS2 (DC Fast)</option>
                    <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                    <option value="GB/T">GB/T (DC Fast)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Charger Capacity (kW)</label>
                  <input type="number" [(ngModel)]="form.Charger_Capacity_kW" name="Charger_Capacity_kW" required class="form-ctrl" />
                </div>

                <div class="form-field">
                  <label>Total Ports Installed</label>
                  <input type="number" [(ngModel)]="form.Total_Ports" name="Total_Ports" required class="form-ctrl" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Active Plugins In-Use</label>
                  <input type="number" [(ngModel)]="form.Active_Plugins" name="Active_Plugins" required class="form-ctrl" />
                </div>

                <div class="form-field">
                  <label>EV Queue Waiting</label>
                  <input type="number" [(ngModel)]="form.Queue_Length" name="Queue_Length" required class="form-ctrl" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Avg Energy Drawn (kWh)</label>
                  <input type="number" step="0.1" [(ngModel)]="form.Avg_Energy_Drawn_kWh" name="Avg_Energy_Drawn_kWh" required class="form-ctrl" />
                </div>

                <div class="form-field">
                  <label>Avg Dwell Time (Mins)</label>
                  <input type="number" [(ngModel)]="form.Avg_Dwell_Time_Min" name="Avg_Dwell_Time_Min" required class="form-ctrl" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Tariff Rate (INR/kWh)</label>
                  <input type="number" step="0.01" [(ngModel)]="form.Tariff_Rate_INR" name="Tariff_Rate_INR" required class="form-ctrl" />
                </div>

                <div class="form-field">
                  <label>Ambient Temperature (°C)</label>
                  <input type="number" [(ngModel)]="form.Temperature_C" name="Temperature_C" required class="form-ctrl" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Weather Condition</label>
                  <select [(ngModel)]="form.Weather" name="Weather" required class="form-ctrl">
                    <option value="Clear">Clear</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Hot/Humid">Hot/Humid</option>
                    <option value="Rainy">Rainy</option>
                  </select>
                </div>

                <div class="form-field">
                  <label>Is Weekend?</label>
                  <select [(ngModel)]="form.Is_Weekend" name="Is_Weekend" class="form-ctrl">
                    <option [ngValue]="0">No (Weekday)</option>
                    <option [ngValue]="1">Yes (Weekend)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Nearby Event Active?</label>
                  <select [(ngModel)]="form.Nearby_Event" name="Nearby_Event" class="form-ctrl">
                    <option [ngValue]="0">No Event</option>
                    <option [ngValue]="1">Major Event Near Station</option>
                  </select>
                </div>

                <div class="form-field">
                  <label>ML Algorithm</label>
                  <select [(ngModel)]="selectedModel" name="selectedModel" class="form-ctrl highlight-select">
                    <option value="Random Forest">Random Forest (300 Trees - Recommended)</option>
                    <option value="Logistic Regression">Logistic Regression (StandardScaler Baseline)</option>
                  </select>
                </div>
              </div>

              <button type="submit" [disabled]="loading" class="btn-predict-submit">
                {{ loading ? 'Running Machine Learning Inference...' : '⚡ Predict Availability' }}
              </button>
            </form>
          </div>

          <!-- Result Panel -->
          <div class="card result-card">
            <div class="card-head">
              <h3>Inference Output & Class Probabilities</h3>
              <span *ngIf="lastPrediction" class="result-timestamp">{{ lastPrediction.timestamp | date:'shortTime' }}</span>
            </div>

            <div *ngIf="!lastPrediction" class="placeholder-state">
              <div class="placeholder-icon">🔮</div>
              <h4>Awaiting Input</h4>
              <p>Select a charging station or customize features, then click "Predict Availability" to generate confidence probabilities.</p>
            </div>

            <div *ngIf="lastPrediction" class="result-body">
              <div class="verdict-banner" [ngClass]="lastPrediction.predicted_status.toLowerCase()">
                <div class="verdict-label">Predicted Station Status</div>
                <div class="verdict-text">{{ lastPrediction.predicted_status }}</div>
                <div class="verdict-model">Model: {{ lastPrediction.model }}</div>
              </div>

              <!-- Probability Chart Canvas -->
              <div class="prob-chart-box">
                <canvas #probChartCanvas></canvas>
              </div>

              <!-- Prob Breakdown Metrics -->
              <div class="probs-metrics-list">
                <div class="prob-metric-item">
                  <div class="p-header">
                    <span class="p-title green"><span class="dot g"></span> Available</span>
                    <span class="p-pct">{{ lastPrediction.probabilities.Available }}%</span>
                  </div>
                  <div class="p-bar"><div class="p-fill g" [style.width.%]="lastPrediction.probabilities.Available"></div></div>
                </div>

                <div class="prob-metric-item">
                  <div class="p-header">
                    <span class="p-title orange"><span class="dot o"></span> Busy</span>
                    <span class="p-pct">{{ lastPrediction.probabilities.Busy }}%</span>
                  </div>
                  <div class="p-bar"><div class="p-fill o" [style.width.%]="lastPrediction.probabilities.Busy"></div></div>
                </div>

                <div class="prob-metric-item">
                  <div class="p-header">
                    <span class="p-title red"><span class="dot r"></span> Fully Congested</span>
                    <span class="p-pct">{{ lastPrediction.probabilities['Fully Congested'] }}%</span>
                  </div>
                  <div class="p-bar"><div class="p-fill r" [style.width.%]="lastPrediction.probabilities['Fully Congested']"></div></div>
                </div>
              </div>

              <!-- Station Comparison Note -->
              <div class="comparison-note">
                <span class="info-icon">ℹ️</span>
                <span>Prediction logged into MongoDB collection <code>prediction_logs</code> (ID: {{ lastPrediction.prediction_id || 'Mock-ID' }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prediction-page {
      padding: 2rem 0 4rem;
      background: #f8fafc;
      min-height: calc(100vh - 4.25rem);
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .badge-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }

    .prediction-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 2rem;
      margin-top: 2rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 1.75rem;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .card-head h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }
    .station-loader {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .select-sm {
      padding: 0.35rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      background: white;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
    }
    .form-ctrl {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      background: white;
      outline: none;
    }
    .form-ctrl:focus {
      border-color: #10b981;
    }
    .highlight-select {
      background: #f0fdf4;
      border-color: #86efac;
      font-weight: 600;
    }
    .btn-predict-submit {
      margin-top: 1rem;
      padding: 0.85rem;
      background: #10b981;
      color: white;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: background 0.2s;
    }
    .btn-predict-submit:hover:not(:disabled) {
      background: #059669;
    }

    .placeholder-state {
      text-align: center;
      padding: 4rem 1.5rem;
      color: #64748b;
    }
    .placeholder-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .placeholder-state h4 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }

    .verdict-banner {
      padding: 1.25rem;
      border-radius: 0.75rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .verdict-banner.available {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .verdict-banner.busy {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .verdict-banner.congested {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .verdict-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .verdict-text {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0.25rem 0;
    }
    .verdict-model {
      font-size: 0.8rem;
      opacity: 0.85;
    }

    .prob-chart-box {
      height: 200px;
      margin-bottom: 1.5rem;
    }

    .probs-metrics-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .prob-metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .p-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-right: 0.35rem;
    }
    .dot.g { background: #10b981; }
    .dot.o { background: #f59e0b; }
    .dot.r { background: #ef4444; }
    .p-bar {
      height: 0.5rem;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .p-fill.g { background: #10b981; height: 100%; }
    .p-fill.o { background: #f59e0b; height: 100%; }
    .p-fill.r { background: #ef4444; height: 100%; }

    .comparison-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
    }
    .comparison-note code {
      color: #0f172a;
      font-weight: 600;
    }

    @media (max-width: 1024px) {
      .prediction-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PredictionComponent implements OnInit {
  @ViewChild('probChartCanvas') probChartCanvas!: ElementRef<HTMLCanvasElement>;

  allStations: Station[] = [];
  selectedModel = 'Random Forest';
  loading = false;
  lastPrediction: PredictionResult | null = null;
  private probChart: Chart | null = null;

  form: PredictionRequest = {
    station_id: 'EV_MUM_108',
    City: 'Mumbai',
    Connector_Type: 'Type 2',
    Is_Weekend: 0,
    Charger_Capacity_kW: 50,
    Total_Ports: 6,
    Active_Plugins: 3,
    Queue_Length: 0,
    Avg_Energy_Drawn_kWh: 56.41,
    Avg_Dwell_Time_Min: 38,
    Tariff_Rate_INR: 17.47,
    Temperature_C: 39,
    Weather: 'Clear',
    Nearby_Event: 0
  };

  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.api.getStations().subscribe(stations => {
      this.allStations = stations;
      const targetId = this.route.snapshot.queryParams['station_id'];
      if (targetId) {
        const found = stations.find(s => s.station_id === targetId);
        if (found) this.populateFormWithStation(found);
      }
    });
  }

  onStationSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;
    const found = this.allStations.find(s => s.station_id === val);
    if (found) {
      this.populateFormWithStation(found);
    }
  }

  populateFormWithStation(st: Station) {
    this.form = {
      station_id: st.station_id,
      City: st.city,
      Connector_Type: st.connector_type,
      Is_Weekend: 0,
      Charger_Capacity_kW: st.charger_capacity_kw,
      Total_Ports: st.total_ports,
      Active_Plugins: st.active_plugins,
      Queue_Length: st.queue_length,
      Avg_Energy_Drawn_kWh: st.avg_energy_drawn_kwh,
      Avg_Dwell_Time_Min: st.avg_dwell_time_min,
      Tariff_Rate_INR: st.tariff_rate_inr,
      Temperature_C: st.temperature_c,
      Weather: st.weather,
      Nearby_Event: st.nearby_event
    };
  }

  predict() {
    this.loading = true;
    const req = { ...this.form, model: this.selectedModel };
    this.api.predict(req).subscribe({
      next: (res) => {
        this.lastPrediction = res;
        this.loading = false;
        setTimeout(() => this.renderProbChart(res), 50);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private renderProbChart(res: PredictionResult) {
    if (!this.probChartCanvas) return;
    if (this.probChart) this.probChart.destroy();

    const probs = [
      res.probabilities.Available,
      res.probabilities.Busy,
      res.probabilities['Fully Congested']
    ];

    this.probChart = new Chart(this.probChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Available', 'Busy', 'Fully Congested'],
        datasets: [{
          label: 'Probability (%)',
          data: probs,
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
