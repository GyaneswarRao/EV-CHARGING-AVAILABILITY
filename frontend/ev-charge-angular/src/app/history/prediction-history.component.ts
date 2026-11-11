import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-prediction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-page">
      <div class="container">
        <div class="page-header">
          <div>
            <h1 class="page-title">Prediction History</h1>
            <p class="page-subtitle">Inspect saved availability forecasts stored in MongoDB <code>prediction_logs</code></p>
          </div>
          <div class="header-tools">
            <input 
              type="text" 
              [(ngModel)]="searchFilter" 
              placeholder="Search Station ID..." 
              class="search-input"
            />
          </div>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Station ID</th>
                  <th>Model Used</th>
                  <th>Predicted Status</th>
                  <th>Probabilities (Avail / Busy / Congested)</th>
                  <th>User Email</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredHistory">
                  <td class="text-muted">{{ item.timestamp | date:'short' }}</td>
                  <td><strong>{{ item.station_id }}</strong></td>
                  <td><span class="badge-model">{{ item.model }}</span></td>
                  <td>
                    <span class="status-pill" [ngClass]="item.predicted_status.toLowerCase()">
                      {{ item.predicted_status }}
                    </span>
                  </td>
                  <td>
                    <div class="prob-mini-strip">
                      <span class="prob-tag g">{{ item.probabilities?.Available }}%</span>
                      <span class="prob-tag o">{{ item.probabilities?.Busy }}%</span>
                      <span class="prob-tag r">{{ item.probabilities?.['Fully Congested'] }}%</span>
                    </div>
                  </td>
                  <td class="text-muted">{{ item.user_id || 'Public User' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="filteredHistory.length === 0" class="empty-msg">
            No prediction logs found matching your filter.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-page {
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
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
    }
    .search-input {
      padding: 0.6rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      width: 240px;
      background: white;
    }
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 1.5rem;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .history-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .history-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .text-muted { color: #64748b; font-size: 0.85rem; }
    .badge-model {
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .status-pill {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .status-pill.available { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-pill.busy { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .status-pill.congested { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .prob-mini-strip {
      display: flex;
      gap: 0.4rem;
    }
    .prob-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
    }
    .prob-tag.g { background: #ecfdf5; color: #065f46; }
    .prob-tag.o { background: #fffbeb; color: #92400e; }
    .prob-tag.r { background: #fef2f2; color: #991b1b; }

    .empty-msg {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
    }
  `]
})
export class PredictionHistoryComponent implements OnInit {
  historyList: any[] = [];
  searchFilter = '';

  private api = inject(ApiService);

  ngOnInit() {
    this.api.getPredictionHistory(100).subscribe(logs => {
      this.historyList = logs;
    });
  }

  get filteredHistory() {
    if (!this.searchFilter.trim()) return this.historyList;
    return this.historyList.filter(item => 
      item.station_id?.toLowerCase().includes(this.searchFilter.toLowerCase())
    );
  }
}
