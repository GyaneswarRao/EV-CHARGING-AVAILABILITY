import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-page">
      <div class="container">
        <div class="page-header">
          <div>
            <h1 class="page-title">EV Charging Demand & Congestion Analytics</h1>
            <p class="page-subtitle">Historical 450-record operational trend evaluation across Maharashtra infrastructure</p>
          </div>
        </div>

        <!-- Row 1: Key Drivers -->
        <div class="charts-grid-2">
          <div class="card">
            <div class="card-header">
              <h3>Weekday vs Weekend Charging Demand</h3>
              <span class="badge">Operational Comparison</span>
            </div>
            <div class="chart-container">
              <canvas #weekendChartCanvas></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Ambient Weather Congestion Impact</h3>
              <span class="badge">Environmental Factors</span>
            </div>
            <div class="chart-container">
              <canvas #weatherChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Row 2: Capacity & Events -->
        <div class="charts-grid-2">
          <div class="card">
            <div class="card-header">
              <h3>Charger Capacity (kW) vs Occupancy Time</h3>
              <span class="badge">Power Ratings</span>
            </div>
            <div class="chart-container">
              <canvas #capacityChartCanvas></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Local Event Impact on Waiting Queues</h3>
              <span class="badge">Surgical Anomaly Detection</span>
            </div>
            <div class="chart-container">
              <canvas #eventChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Row 3: City Tariff & Energy Benchmarks -->
        <div class="card mt-4">
          <div class="card-header">
            <h3>City-Wise Average Tariff & Session Energy Consumption</h3>
            <span class="badge">Economic & Power Benchmark</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Total Observations</th>
                  <th>Unique Stations</th>
                  <th>Avg Queue</th>
                  <th>Avg Energy (kWh)</th>
                  <th>Avg Dwell Time</th>
                  <th>Tariff Rate (₹/kWh)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of cityMetrics">
                  <td><strong>{{ c.city }}</strong></td>
                  <td>{{ c.total_records }}</td>
                  <td>{{ c.unique_stations }}</td>
                  <td><span class="badge-queue">{{ c.avg_queue_length }} EVs</span></td>
                  <td>{{ c.avg_energy_drawn_kwh }} kWh</td>
                  <td>{{ c.avg_dwell_time_min }} mins</td>
                  <td>₹{{ c.avg_tariff_rate_inr.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page {
      padding: 2rem 0 4rem;
      background: #f8fafc;
      min-height: calc(100vh - 4.25rem);
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
    }
    .charts-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
    .chart-container {
      height: 280px;
      position: relative;
    }
    .mt-4 { margin-top: 1.5rem; }
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .badge-queue {
      background: #fee2e2;
      color: #b91c1c;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 700;
      font-size: 0.8rem;
    }

    @media (max-width: 900px) {
      .charts-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('weekendChartCanvas') weekendChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weatherChartCanvas') weatherChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('capacityChartCanvas') capacityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('eventChartCanvas') eventChartCanvas!: ElementRef<HTMLCanvasElement>;

  cityMetrics: any[] = [];
  private api = inject(ApiService);

  ngOnInit() {
    this.api.getCityWiseAnalytics().subscribe(cities => {
      this.cityMetrics = cities;
    });

    this.api.getDemandAnalytics().subscribe(demand => {
      if (demand.weekend_comparison) this.renderWeekendChart(demand.weekend_comparison);
      if (demand.weather_impact) this.renderWeatherChart(demand.weather_impact);
      if (demand.capacity_analysis) this.renderCapacityChart(demand.capacity_analysis);
      if (demand.event_impact) this.renderEventChart(demand.event_impact);
    });
  }

  private renderWeekendChart(wk: any) {
    if (!this.weekendChartCanvas) return;
    new Chart(this.weekendChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Weekday', 'Weekend'],
        datasets: [
          {
            label: 'Avg Active Plugins',
            data: [wk['Weekday']?.avg_active_plugins || 0, wk['Weekend']?.avg_active_plugins || 0],
            backgroundColor: '#2563eb'
          },
          {
            label: 'Avg Queue Length',
            data: [wk['Weekday']?.avg_queue || 0, wk['Weekend']?.avg_queue || 0],
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private renderWeatherChart(weatherList: any[]) {
    if (!this.weatherChartCanvas) return;
    const labels = weatherList.map(w => w.weather);
    const energy = weatherList.map(w => w.avg_energy_kwh);

    new Chart(this.weatherChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg Energy Drawn (kWh)',
          data: energy,
          backgroundColor: ['#38bdf8', '#818cf8', '#fb923c', '#4ade80']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private renderCapacityChart(capacityList: any[]) {
    if (!this.capacityChartCanvas) return;
    const labels = capacityList.map(c => `${c.capacity_kw} kW`);
    const dwell = capacityList.map(c => c.avg_dwell_time);

    new Chart(this.capacityChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg Dwell Time (Minutes)',
          data: dwell,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private renderEventChart(eventData: any) {
    if (!this.eventChartCanvas) return;
    const labels = Object.keys(eventData);
    const queues = labels.map(k => eventData[k].avg_queue);
    const plugins = labels.map(k => eventData[k].avg_active_plugins);

    new Chart(this.eventChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Avg Waiting Queue', data: queues, backgroundColor: '#f43f5e' },
          { label: 'Avg Active Plugins', data: plugins, backgroundColor: '#0ea5e9' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
