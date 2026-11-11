import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Station } from '../core/models';

@Component({
  selector: 'app-stations-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="explorer-page">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Charging Station Explorer</h1>
            <p class="page-subtitle">Search, filter, and inspect verified operational stations across Maharashtra</p>
          </div>
          <div class="header-action">
            <span class="count-badge">{{ filteredStations.length }} Stations Found</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-card">
          <div class="filter-grid">
            <div class="filter-item">
              <label>Search Station or Area</label>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="applyFilters()" 
                placeholder="e.g. EV_MUM_108 or Bandra..."
                class="form-control"
              />
            </div>

            <div class="filter-item">
              <label>City</label>
              <select [(ngModel)]="selectedCity" (ngModelChange)="onCityChange()" class="form-control">
                <option value="">All Cities</option>
                <option *ngFor="let c of citiesList" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label>Area / Locality</label>
              <select [(ngModel)]="selectedArea" (ngModelChange)="applyFilters()" class="form-control" [disabled]="!selectedCity">
                <option value="">All Areas</option>
                <option *ngFor="let a of availableAreas" [value]="a">{{ a }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label>Connector Type</label>
              <select [(ngModel)]="selectedConnector" (ngModelChange)="applyFilters()" class="form-control">
                <option value="">All Connectors</option>
                <option value="CCS2">CCS2 (DC Fast)</option>
                <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                <option value="GB/T">GB/T</option>
                <option value="Type 2">Type 2 (AC)</option>
              </select>
            </div>

            <div class="filter-item">
              <label>Current Status</label>
              <select [(ngModel)]="selectedStatus" (ngModelChange)="applyFilters()" class="form-control">
                <option value="">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Busy">Busy</option>
                <option value="Fully Congested">Fully Congested</option>
              </select>
            </div>

            <div class="filter-item">
              <label>Sort By</label>
              <select [(ngModel)]="sortBy" (ngModelChange)="applyFilters()" class="form-control">
                <option value="id">Station ID</option>
                <option value="queue_asc">Shortest Queue First</option>
                <option value="queue_desc">Longest Queue First</option>
                <option value="tariff_asc">Lowest Tariff First</option>
                <option value="tariff_desc">Highest Tariff First</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Station Cards Grid -->
        <div class="station-grid">
          <div *ngFor="let st of filteredStations" class="station-card">
            <div class="card-top">
              <div class="station-identity">
                <span class="station-id">{{ st.station_id }}</span>
                <span class="station-geo">{{ st.area }}, {{ st.city }}</span>
              </div>
              <span class="status-pill" [ngClass]="getStatusClass(st.current_status)">
                <span class="status-dot"></span>
                {{ st.current_status }}
              </span>
            </div>

            <div class="station-metrics">
              <div class="metric-row">
                <span class="m-label">Connector:</span>
                <span class="m-val highlight">{{ st.connector_type }}</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Capacity:</span>
                <span class="m-val">{{ st.charger_capacity_kw }} kW Fast Charger</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Port Occupancy:</span>
                <span class="m-val">{{ st.active_plugins }} / {{ st.total_ports }} ports active</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Waiting Queue:</span>
                <span class="m-val" [class.text-red]="st.queue_length > 2">{{ st.queue_length }} EVs waiting</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Tariff Rate:</span>
                <span class="m-val">₹{{ st.tariff_rate_inr.toFixed(2) }} / kWh</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Ambient Weather:</span>
                <span class="m-val">{{ st.weather }} • {{ st.temperature_c }}°C</span>
              </div>
            </div>

            <div class="card-footer">
              <a [routerLink]="['/predict']" [queryParams]="{ station_id: st.station_id }" class="btn-predict-card">
                Predict Availability →
              </a>
              <a [routerLink]="['/map']" [queryParams]="{ station_id: st.station_id }" class="btn-map-card">
                Locate on Map 📍
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="filteredStations.length === 0" class="empty-state">
          <h3>No Charging Stations Match Filters</h3>
          <p>Try clearing your search query or selecting a different city.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .explorer-page {
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
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
    .count-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .filter-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .filter-item label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .form-control {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      background: white;
      outline: none;
    }
    .form-control:focus {
      border-color: #10b981;
    }

    .station-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .station-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .station-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }
    .station-identity {
      display: flex;
      flex-direction: column;
    }
    .station-id {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .station-geo {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.15rem;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .status-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
    }
    .status-available {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .status-available .status-dot { background: #10b981; }

    .status-busy {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .status-busy .status-dot { background: #f59e0b; }

    .status-congested {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .status-congested .status-dot { background: #ef4444; }

    .station-metrics {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .m-label { color: #64748b; }
    .m-val { font-weight: 600; color: #1e293b; }
    .m-val.highlight { color: #0284c7; }
    .text-red { color: #ef4444; font-weight: 700; }

    .card-footer {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-predict-card {
      flex: 1;
      text-align: center;
      padding: 0.55rem;
      background: #10b981;
      color: white;
      border-radius: 0.5rem;
      font-size: 0.825rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-predict-card:hover { background: #059669; }
    .btn-map-card {
      padding: 0.55rem 0.75rem;
      background: #f1f5f9;
      color: #334155;
      border-radius: 0.5rem;
      font-size: 0.825rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-map-card:hover { background: #e2e8f0; }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }
  `]
})
export class StationsExplorerComponent implements OnInit {
  allStations: Station[] = [];
  filteredStations: Station[] = [];
  cityMap: { [c: string]: string[] } = {};
  citiesList: string[] = [];
  availableAreas: string[] = [];

  searchQuery = '';
  selectedCity = '';
  selectedArea = '';
  selectedConnector = '';
  selectedStatus = '';
  sortBy = 'id';

  private api = inject(ApiService);

  ngOnInit() {
    this.api.getCities().subscribe(cmap => {
      this.cityMap = cmap;
      this.citiesList = Object.keys(cmap);
    });

    this.loadStations();
  }

  loadStations() {
    this.api.getStations().subscribe(stations => {
      this.allStations = stations;
      this.applyFilters();
    });
  }

  onCityChange() {
    if (this.selectedCity && this.cityMap[this.selectedCity]) {
      this.availableAreas = this.cityMap[this.selectedCity];
    } else {
      this.availableAreas = [];
    }
    this.selectedArea = '';
    this.applyFilters();
  }

  applyFilters() {
    let res = [...this.allStations];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      res = res.filter(s => 
        s.station_id.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
      );
    }

    if (this.selectedCity) {
      res = res.filter(s => s.city.toLowerCase() === this.selectedCity.toLowerCase());
    }

    if (this.selectedArea) {
      res = res.filter(s => s.area.toLowerCase() === this.selectedArea.toLowerCase());
    }

    if (this.selectedConnector) {
      res = res.filter(s => s.connector_type === this.selectedConnector);
    }

    if (this.selectedStatus) {
      res = res.filter(s => s.current_status === this.selectedStatus);
    }

    // Sort
    if (this.sortBy === 'queue_asc') {
      res.sort((a, b) => a.queue_length - b.queue_length);
    } else if (this.sortBy === 'queue_desc') {
      res.sort((a, b) => b.queue_length - a.queue_length);
    } else if (this.sortBy === 'tariff_asc') {
      res.sort((a, b) => a.tariff_rate_inr - b.tariff_rate_inr);
    } else if (this.sortBy === 'tariff_desc') {
      res.sort((a, b) => b.tariff_rate_inr - a.tariff_rate_inr);
    } else {
      res.sort((a, b) => a.station_id.localeCompare(b.station_id));
    }

    this.filteredStations = res;
  }

  getStatusClass(status: string): string {
    if (status === 'Available') return 'status-available';
    if (status === 'Busy') return 'status-busy';
    return 'status-congested';
  }
}
