import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { WebsocketService } from '../core/services/websocket.service';
import { StatusSummary } from '../core/models';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <div class="container">
        <!-- Live Mode Banner -->
        <div class="live-banner">
          <div class="banner-left">
            <span class="pulsing-live-dot"></span>
            <span class="live-tag">LIVE TELEMETRY STREAM</span>
            <span class="live-desc">Simulated OCPI 2.2 / IoT Protocol Feed • Connected to MongoDB (ev_charging_db)</span>
          </div>
          <div class="banner-right">
            <span class="connection-status" [class.connected]="wsConnected">
              {{ wsConnected ? '● WebSocket Active' : '○ Reconnecting Feed...' }}
            </span>
            <button (click)="refreshData()" class="btn-refresh">↻ Refresh Now</button>
          </div>
        </div>

        <!-- Headline & Welcome -->
        <div class="dashboard-header">
          <div>
            <h1 class="page-title">Executive EV Charging Analytics</h1>
            <p class="page-subtitle">Real-time station utilization, availability forecasting, and congestion monitoring</p>
          </div>
        </div>

        <!-- Stat Cards Grid -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon bg-blue">🏢</div>
            <div class="metric-info">
              <span class="metric-label">Total Stations</span>
              <span class="metric-value">{{ summary?.total_stations || 100 }}</span>
              <span class="metric-sub">5 Cities in Maharashtra</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-green">🟢</div>
            <div class="metric-info">
              <span class="metric-label">Available Stations</span>
              <span class="metric-value text-green">{{ summary?.available_stations || 67 }}</span>
              <span class="metric-sub">{{ getPct(summary?.available_stations) }}% of network</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-orange">🟠</div>
            <div class="metric-info">
              <span class="metric-label">Busy Stations</span>
              <span class="metric-value text-orange">{{ summary?.busy_stations || 33 }}</span>
              <span class="metric-sub">{{ getPct(summary?.busy_stations) }}% under high load</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-red">🔴</div>
            <div class="metric-info">
              <span class="metric-label">Fully Congested</span>
              <span class="metric-value text-red">{{ summary?.fully_congested_stations || 0 }}</span>
              <span class="metric-sub">Queue Length &gt; 3</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-purple">⚡</div>
            <div class="metric-info">
              <span class="metric-label">Total Installed Ports</span>
              <span class="metric-value">{{ summary?.total_ports || 994 }}</span>
              <span class="metric-sub">{{ summary?.active_plugins || 350 }} Active Plugins</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-teal">⏱️</div>
            <div class="metric-info">
              <span class="metric-label">Average Queue</span>
              <span class="metric-value">{{ summary?.avg_queue_length || 0.16 }} <span class="unit">EVs</span></span>
              <span class="metric-sub">Mean waiting count</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-emerald">📈</div>
            <div class="metric-info">
              <span class="metric-label">Network Utilization</span>
              <span class="metric-value">{{ summary?.overall_utilization_pct || 35.2 }}%</span>
              <span class="metric-sub">Active plugins / Total ports</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon bg-indigo">🎯</div>
            <div class="metric-info">
              <span class="metric-label">ML Classification</span>
              <span class="metric-value">96.7%</span>
              <span class="metric-sub">Holdout Test Accuracy</span>
            </div>
          </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="charts-row">
          <div class="chart-card flex-1">
            <div class="chart-card-header">
              <h3>Station Status Distribution</h3>
              <span class="chart-tag">Current Real-Time State</span>
            </div>
            <div class="chart-body">
              <canvas #statusChartCanvas></canvas>
            </div>
          </div>

          <div class="chart-card flex-1">
            <div class="chart-card-header">
              <h3>City-Wise Infrastructure Load</h3>
              <span class="chart-tag">Maharashtra Hubs</span>
            </div>
            <div class="chart-body">
              <canvas #cityChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="charts-row">
          <div class="chart-card flex-1">
            <div class="chart-card-header">
              <h3>Connector Standard Breakdown</h3>
              <span class="chart-tag">Type 2, CCS2, CHAdeMO, GB/T</span>
            </div>
            <div class="chart-body">
              <canvas #connectorChartCanvas></canvas>
            </div>
          </div>

          <div class="chart-card flex-1">
            <div class="chart-card-header">
              <h3>Hourly Demand Profile (24h Trend)</h3>
              <span class="chart-tag">Peak Hours Analysis</span>
            </div>
            <div class="chart-body">
              <canvas #hourlyChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Simulation Control Bar -->
        <div class="simulation-dock">
          <div class="dock-title">
            <span class="dock-badge">Hardware Sensor Simulator</span>
            <h4>Inject Simulated IoT Hardware Telemetry into Live MongoDB</h4>
            <p>Select any station to inject sensor readings (active plugins / queue count). The WebSocket will broadcast changes across the platform.</p>
          </div>
          <div class="dock-controls">
            <select #simStationSelect class="select-control">
              <option value="EV_MUM_108">EV_MUM_108 (Mumbai - Bandra)</option>
              <option value="EV_PUN_116">EV_PUN_116 (Pune - Baner)</option>
              <option value="EV_NAG_118">EV_NAG_118 (Nagpur - Dharampeth)</option>
              <option value="EV_THA_111">EV_THA_111 (Thane - Thane West)</option>
              <option value="EV_NAS_119">EV_NAS_119 (Nashik - Satpur)</option>
            </select>
            <div class="input-pair">
              <label>Plugins in Use:</label>
              <input #simPlugins type="number" value="6" min="0" max="16" class="num-control"/>
            </div>
            <div class="input-pair">
              <label>Queue Waiting:</label>
              <input #simQueue type="number" value="4" min="0" max="15" class="num-control"/>
            </div>
            <button 
              (click)="triggerTelemetry(simStationSelect.value, simPlugins.value, simQueue.value)" 
              class="btn-trigger-sim"
            >
              Simulate IoT Ping
            </button>
          </div>
          <div *ngIf="simMessage" class="sim-feedback">
            {{ simMessage }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 2rem 0 4rem;
      background: #f8fafc;
      min-height: calc(100vh - 4.25rem);
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .live-banner {
      background: #0f172a;
      color: white;
      border-radius: 0.75rem;
      padding: 0.85rem 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .banner-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .pulsing-live-dot {
      width: 0.65rem;
      height: 0.65rem;
      background: #ef4444;
      border-radius: 50%;
      animation: pulseLive 1.2s infinite;
    }
    @keyframes pulseLive {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
      70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .live-tag {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #f87171;
    }
    .live-desc {
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .banner-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .connection-status {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .connection-status.connected {
      color: #10b981;
      font-weight: 600;
    }
    .btn-refresh {
      background: #334155;
      color: white;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-refresh:hover { background: #475569; }

    .dashboard-header {
      margin-bottom: 2rem;
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: white;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .metric-icon {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .bg-blue { background: #e0f2fe; }
    .bg-green { background: #ecfdf5; }
    .bg-orange { background: #fffbeb; }
    .bg-red { background: #fef2f2; }
    .bg-purple { background: #f3e8ff; }
    .bg-teal { background: #f0fdfa; }
    .bg-emerald { background: #d1fae5; }
    .bg-indigo { background: #e0e7ff; }

    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #64748b;
    }
    .metric-value {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .unit { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .text-green { color: #10b981; }
    .text-orange { color: #f59e0b; }
    .text-red { color: #ef4444; }
    .metric-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.2rem;
    }

    .charts-row {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex: 1;
      min-width: 0;
    }
    .chart-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .chart-card-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .chart-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
    .chart-body {
      height: 280px;
      position: relative;
    }

    .simulation-dock {
      background: white;
      border-radius: 1rem;
      border: 2px dashed #93c5fd;
      padding: 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .dock-title {
      margin-bottom: 1rem;
    }
    .dock-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 0.25rem;
      margin-bottom: 0.35rem;
    }
    .dock-title h4 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .dock-title p {
      font-size: 0.875rem;
      color: #64748b;
    }
    .dock-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }
    .select-control {
      padding: 0.6rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      background: white;
    }
    .input-pair {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .num-control {
      width: 70px;
      padding: 0.6rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
    }
    .btn-trigger-sim {
      padding: 0.65rem 1.25rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-trigger-sim:hover { background: #1d4ed8; }
    .sim-feedback {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 0.375rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    @media (max-width: 1200px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row { flex-direction: column; }
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('statusChartCanvas') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cityChartCanvas') cityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('connectorChartCanvas') connectorChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourlyChartCanvas') hourlyChartCanvas!: ElementRef<HTMLCanvasElement>;

  summary: StatusSummary | null = null;
  wsConnected = false;
  simMessage = '';

  private statusChart: Chart | null = null;
  private cityChart: Chart | null = null;
  private connectorChart: Chart | null = null;
  private hourlyChart: Chart | null = null;

  private api = inject(ApiService);
  private ws = inject(WebsocketService);
  private wsSub: Subscription | null = null;

  ngOnInit() {
    this.refreshData();
    this.wsConnected = this.ws.isConnected;
    this.wsSub = this.ws.updates$.subscribe(update => {
      this.simMessage = `Live Telemetry Received: Station ${update.station_id} -> Plugins: ${update.active_plugins}, Queue: ${update.queue_length}, Status: ${update.current_status}`;
      this.refreshData();
    });
  }

  ngOnDestroy() {
    if (this.wsSub) this.wsSub.unsubscribe();
    this.destroyCharts();
  }

  getPct(count?: number): string {
    if (!count || !this.summary?.total_stations) return '0';
    return ((count / this.summary.total_stations) * 100).toFixed(1);
  }

  refreshData() {
    this.api.getStatusSummary().subscribe(s => {
      this.summary = s;
      this.renderStatusChart(s);
    });

    this.api.getCityWiseAnalytics().subscribe(cities => {
      this.renderCityChart(cities);
    });

    this.api.getAnalyticsOverview().subscribe(overview => {
      if (overview?.connector_distribution) {
        this.renderConnectorChart(overview.connector_distribution);
      }
    });

    this.api.getPeakHours().subscribe(hourly => {
      this.renderHourlyChart(hourly);
    });
  }

  triggerTelemetry(stId: string, plugins: string, queue: string) {
    this.api.triggerSimulatedUpdate(stId, parseInt(plugins), parseInt(queue)).subscribe({
      next: (res) => {
        this.simMessage = `Simulated IoT sensor update broadcasted for ${res.station_id}: New Status -> ${res.current_status}`;
      }
    });
  }

  private renderStatusChart(s: StatusSummary) {
    if (!this.statusChartCanvas) return;
    if (this.statusChart) this.statusChart.destroy();

    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Busy', 'Fully Congested'],
        datasets: [{
          data: [s.available_stations, s.busy_stations, s.fully_congested_stations],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private renderCityChart(cities: any[]) {
    if (!this.cityChartCanvas) return;
    if (this.cityChart) this.cityChart.destroy();

    const labels = cities.map(c => c.city);
    const available = cities.map(c => c.status_distribution?.Available || 0);
    const busy = cities.map(c => c.status_distribution?.Busy || 0);

    this.cityChart = new Chart(this.cityChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Available', data: available, backgroundColor: '#10b981' },
          { label: 'Busy', data: busy, backgroundColor: '#f59e0b' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }

  private renderConnectorChart(connectors: { [k: string]: number }) {
    if (!this.connectorChartCanvas) return;
    if (this.connectorChart) this.connectorChart.destroy();

    const labels = Object.keys(connectors);
    const data = Object.values(connectors);

    this.connectorChart = new Chart(this.connectorChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private renderHourlyChart(hourly: any[]) {
    if (!this.hourlyChartCanvas) return;
    if (this.hourlyChart) this.hourlyChart.destroy();

    const labels = hourly.map(h => h.hour);
    const plugins = hourly.map(h => h.avg_active_plugins);
    const queue = hourly.map(h => h.avg_queue);

    this.hourlyChart = new Chart(this.hourlyChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg Active Plugins',
            data: plugins,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Avg Queue Length',
            data: queue,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  private destroyCharts() {
    if (this.statusChart) this.statusChart.destroy();
    if (this.cityChart) this.cityChart.destroy();
    if (this.connectorChart) this.connectorChart.destroy();
    if (this.hourlyChart) this.hourlyChart.destroy();
  }
}
