import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { Station } from '../core/models';
import * as L from 'leaflet';

@Component({
  selector: 'app-station-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="map-page">
      <div class="map-sidebar">
        <div class="sidebar-header">
          <h2>Geospatial Station Map</h2>
          <p class="sidebar-subtitle">Leaflet.js + OpenStreetMap integration</p>
        </div>

        <div class="filter-box">
          <label>Filter by City</label>
          <select [(ngModel)]="selectedCity" (ngModelChange)="filterMapStations()" class="form-control">
            <option value="">All Maharashtra Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Nagpur">Nagpur</option>
            <option value="Nashik">Nashik</option>
            <option value="Thane">Thane</option>
          </select>

          <label class="mt-2">Filter Availability</label>
          <select [(ngModel)]="selectedStatus" (ngModelChange)="filterMapStations()" class="form-control">
            <option value="">All Statuses</option>
            <option value="Available">Available (Green)</option>
            <option value="Busy">Busy (Orange)</option>
            <option value="Fully Congested">Congested (Red)</option>
          </select>
        </div>

        <div class="legend-box">
          <div class="legend-item"><span class="legend-pin green"></span> Available Stations</div>
          <div class="legend-item"><span class="legend-pin orange"></span> Busy / Moderate Queue</div>
          <div class="legend-item"><span class="legend-pin red"></span> Fully Congested</div>
        </div>

        <div class="station-list">
          <div 
            *ngFor="let st of visibleStations" 
            class="station-list-item"
            [class.active]="selectedStation?.station_id === st.station_id"
            (click)="panToStation(st)"
          >
            <div class="item-head">
              <span class="st-id">{{ st.station_id }}</span>
              <span class="st-status" [ngClass]="st.current_status.toLowerCase()">{{ st.current_status }}</span>
            </div>
            <div class="item-sub">{{ st.area }}, {{ st.city }} • {{ st.connector_type }}</div>
            <div class="item-queue">Queue: {{ st.queue_length }} EVs • Active: {{ st.active_plugins }}/{{ st.total_ports }}</div>
          </div>
        </div>
      </div>

      <div class="map-container-wrapper">
        <div #mapContainer class="map-view"></div>
        <div *ngIf="selectedStation" class="floating-station-panel">
          <div class="floating-header">
            <h4>{{ selectedStation.station_id }}</h4>
            <button (click)="selectedStation = null" class="btn-close">✕</button>
          </div>
          <p class="panel-geo">{{ selectedStation.area }}, {{ selectedStation.city }}</p>
          <div class="panel-details">
            <div><strong>Status:</strong> {{ selectedStation.current_status }}</div>
            <div><strong>Connector:</strong> {{ selectedStation.connector_type }}</div>
            <div><strong>Capacity:</strong> {{ selectedStation.charger_capacity_kw }} kW</div>
            <div><strong>Ports:</strong> {{ selectedStation.active_plugins }} / {{ selectedStation.total_ports }} Occupied</div>
            <div><strong>Queue Length:</strong> {{ selectedStation.queue_length }} Vehicles</div>
            <div><strong>Tariff:</strong> ₹{{ selectedStation.tariff_rate_inr }} / kWh</div>
          </div>
          <div class="panel-actions">
            <a [routerLink]="['/predict']" [queryParams]="{ station_id: selectedStation.station_id }" class="btn-panel-predict">
              Run AI Predictor on this Station →
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page {
      display: flex;
      height: calc(100vh - 4.25rem);
      width: 100%;
      position: relative;
    }
    .map-sidebar {
      width: 360px;
      height: 100%;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      z-index: 10;
      box-shadow: 2px 0 8px rgba(0,0,0,0.05);
    }
    .sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .sidebar-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .sidebar-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.2rem;
    }
    .filter-box {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .filter-box label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.25rem;
    }
    .mt-2 { margin-top: 0.75rem; }
    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      font-size: 0.85rem;
      background: white;
    }
    .legend-box {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.75rem;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-pin {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
    }
    .legend-pin.green { background: #10b981; }
    .legend-pin.orange { background: #f59e0b; }
    .legend-pin.red { background: #ef4444; }

    .station-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
    }
    .station-list-item {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #f1f5f9;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .station-list-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .station-list-item.active {
      background: #ecfdf5;
      border-color: #10b981;
    }
    .item-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .st-id { font-weight: 700; font-size: 0.9rem; color: #0f172a; }
    .st-status {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }
    .st-status.available { background: #ecfdf5; color: #065f46; }
    .st-status.busy { background: #fffbeb; color: #92400e; }
    .st-status.congested { background: #fef2f2; color: #991b1b; }
    .item-sub { font-size: 0.8rem; color: #64748b; }
    .item-queue { font-size: 0.75rem; color: #0369a1; margin-top: 0.25rem; font-weight: 600; }

    .map-container-wrapper {
      flex: 1;
      height: 100%;
      position: relative;
    }
    .map-view {
      width: 100%;
      height: 100%;
    }

    .floating-station-panel {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 320px;
      background: white;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      z-index: 1000;
    }
    .floating-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .floating-header h4 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1rem;
      color: #64748b;
      cursor: pointer;
    }
    .panel-geo {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    .panel-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.825rem;
      color: #334155;
      margin-bottom: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-panel-predict {
      display: block;
      text-align: center;
      padding: 0.6rem;
      background: #10b981;
      color: white;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-panel-predict:hover { background: #059669; }

    @media (max-width: 768px) {
      .map-page { flex-direction: column; }
      .map-sidebar { width: 100%; height: 300px; }
    }
  `]
})
export class StationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  allStations: Station[] = [];
  visibleStations: Station[] = [];
  selectedStation: Station | null = null;
  selectedCity = '';
  selectedStatus = '';

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.api.getStations().subscribe(stations => {
      this.allStations = stations;
      this.visibleStations = stations;
      this.populateMarkers();

      const targetId = this.route.snapshot.queryParams['station_id'];
      if (targetId) {
        const found = this.allStations.find(s => s.station_id === targetId);
        if (found) {
          setTimeout(() => this.panToStation(found), 500);
        }
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!this.mapContainer) return;

    // Center on Maharashtra (coordinates around Pune/Mumbai)
    this.map = L.map(this.mapContainer.nativeElement).setView([19.2, 74.8], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors • EV Charge Maharashtra'
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    if (this.allStations.length > 0) {
      this.populateMarkers();
    }
  }

  filterMapStations() {
    let res = [...this.allStations];
    if (this.selectedCity) {
      res = res.filter(s => s.city.toLowerCase() === this.selectedCity.toLowerCase());
    }
    if (this.selectedStatus) {
      res = res.filter(s => s.current_status === this.selectedStatus);
    }
    this.visibleStations = res;
    this.populateMarkers();

    if (this.selectedCity && this.visibleStations.length > 0) {
      const first = this.visibleStations[0];
      this.map?.setView([first.latitude, first.longitude], 12);
    }
  }

  panToStation(st: Station) {
    this.selectedStation = st;
    if (this.map) {
      this.map.flyTo([st.latitude, st.longitude], 14, { duration: 1.2 });
    }
  }

  private populateMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    this.visibleStations.forEach(st => {
      let pinColor = '#10b981';
      if (st.current_status === 'Busy') pinColor = '#f59e0b';
      if (st.current_status === 'Fully Congested') pinColor = '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-ev-pin',
        html: `
          <div style="
            background: ${pinColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">⚡</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon });
      marker.on('click', () => {
        this.selectedStation = st;
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; color: #0f172a;">${st.station_id}</h4>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">${st.area}, ${st.city}</p>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Status:</strong> <span style="color: ${pinColor}; font-weight: bold;">${st.current_status}</span></div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Queue:</strong> ${st.queue_length} EVs</div>
          <div style="font-size: 12px; margin-bottom: 6px;"><strong>Active Ports:</strong> ${st.active_plugins}/${st.total_ports}</div>
          <a href="/predict?station_id=${st.station_id}" style="color: #10b981; font-size: 12px; font-weight: bold; text-decoration: none;">Run AI Prediction →</a>
        </div>
      `);

      this.markersLayer?.addLayer(marker);
    });
  }
}
