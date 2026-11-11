import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="container">
        <div class="page-header">
          <div>
            <div class="admin-shield">🛡️ Administrator Management Console</div>
            <h1 class="page-title">EV Network Operations & Administration</h1>
            <p class="page-subtitle">Dataset uploads, model retraining pipeline, user account control, and live database logs</p>
          </div>
        </div>

        <!-- Action Cards Grid -->
        <div class="admin-actions-grid">
          <!-- Card 1: Retraining Trigger -->
          <div class="card action-card">
            <div class="card-head">
              <h3>Model Retraining Engine</h3>
              <span class="badge">Supervised Learning</span>
            </div>
            <p class="card-desc">Re-fit Random Forest (300 estimators) and Logistic Regression using all latest records currently in MongoDB.</p>
            <div class="status-indicator">
              <strong>Retraining Status:</strong> {{ trainingState?.last_status || 'Idle / Ready' }}
            </div>
            <button (click)="triggerRetrain()" [disabled]="trainingState?.is_training" class="btn-retrain">
              {{ trainingState?.is_training ? 'Retraining Pipeline Underway...' : '⚡ Trigger Model Retraining' }}
            </button>
            <div *ngIf="retrainSuccessMessage" class="feedback-msg">
              {{ retrainSuccessMessage }}
            </div>
          </div>

          <!-- Card 2: Dataset Upload -->
          <div class="card action-card">
            <div class="card-head">
              <h3>Upload & Ingest CSV Telemetry</h3>
              <span class="badge">Data Pipeline</span>
            </div>
            <p class="card-desc">Upload a new batch CSV dataset. The pipeline validates columns, types, drops duplicates, and updates collections.</p>
            <div class="upload-dropzone">
              <input type="file" (change)="onFileSelected($event)" accept=".csv" class="file-input" />
              <div class="selected-filename" *ngIf="selectedFile">
                Selected: <strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
              </div>
            </div>
            <div class="reset-checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="resetExisting" />
                Reset existing MongoDB collections before import
              </label>
            </div>
            <button (click)="uploadDataset()" [disabled]="!selectedFile || uploading" class="btn-upload">
              {{ uploading ? 'Validating & Ingesting...' : 'Upload & Process Dataset' }}
            </button>
            <div *ngIf="uploadSuccessMessage" class="feedback-msg">
              {{ uploadSuccessMessage }}
            </div>
          </div>
        </div>

        <!-- Registered Users Table -->
        <div class="card mt-4">
          <div class="card-head">
            <h3>Registered User Accounts</h3>
            <span class="badge">{{ usersList.length }} Accounts</span>
          </div>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of usersList">
                  <td><strong>{{ u.name }}</strong></td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="role-badge" [class.admin]="u.role === 'admin'">
                      {{ u.role | uppercase }}
                    </span>
                  </td>
                  <td class="text-muted">{{ u.created_at | date:'medium' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Operational Records Preview Table -->
        <div class="card mt-4">
          <div class="card-head">
            <h3>Operational Records in MongoDB (<code>ev_records</code>)</h3>
            <span class="badge">{{ totalRecords }} Total Records</span>
          </div>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Station ID</th>
                  <th>City</th>
                  <th>Connector</th>
                  <th>Active / Ports</th>
                  <th>Queue</th>
                  <th>Energy Drawn</th>
                  <th>Recorded Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of operationalRecords">
                  <td>{{ r.Date }} {{ r.Time }}</td>
                  <td><strong>{{ r.Station_ID }}</strong></td>
                  <td>{{ r.City }}</td>
                  <td>{{ r.Connector_Type }}</td>
                  <td>{{ r.Active_Plugins }} / {{ r.Total_Ports }}</td>
                  <td>{{ r.Queue_Length }}</td>
                  <td>{{ r.Avg_Energy_Drawn_kWh }} kWh</td>
                  <td>
                    <span class="status-pill" [ngClass]="r.Station_Status.toLowerCase()">
                      {{ r.Station_Status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
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
    .admin-shield {
      font-size: 0.8rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
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

    .admin-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-head h3 {
      font-size: 1.15rem;
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
    .card-desc {
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .status-indicator {
      font-size: 0.85rem;
      color: #334155;
      padding: 0.6rem 0.85rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.25rem;
    }
    .btn-retrain {
      padding: 0.75rem 1.25rem;
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-size: 0.9rem;
    }
    .btn-retrain:hover:not(:disabled) {
      background: #1e293b;
    }

    .upload-dropzone {
      margin-bottom: 1rem;
    }
    .file-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px dashed #cbd5e1;
      border-radius: 0.5rem;
      background: #f8fafc;
      font-size: 0.85rem;
    }
    .selected-filename {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #0369a1;
    }
    .reset-checkbox {
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #475569;
    }
    .btn-upload {
      padding: 0.75rem 1.25rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-size: 0.9rem;
    }
    .btn-upload:hover:not(:disabled) {
      background: #059669;
    }
    .feedback-msg {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 0.375rem;
      font-size: 0.85rem;
    }

    .mt-4 { margin-top: 1.5rem; }
    .table-responsive {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    .admin-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .admin-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .text-muted { color: #64748b; font-size: 0.8rem; }
    .role-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 0.25rem;
      background: #e2e8f0;
      color: #334155;
    }
    .role-badge.admin {
      background: #fef3c7;
      color: #b45309;
    }
    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }
    .status-pill.available { background: #ecfdf5; color: #065f46; }
    .status-pill.busy { background: #fffbeb; color: #92400e; }
    .status-pill.congested { background: #fef2f2; color: #991b1b; }

    @media (max-width: 900px) {
      .admin-actions-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  usersList: any[] = [];
  operationalRecords: any[] = [];
  totalRecords = 0;
  trainingState: any = null;
  retrainSuccessMessage = '';
  uploadSuccessMessage = '';

  selectedFile: File | null = null;
  resetExisting = false;
  uploading = false;

  private api = inject(ApiService);

  ngOnInit() {
    this.loadAdminData();
  }

  loadAdminData() {
    this.api.getAdminUsers().subscribe(users => {
      this.usersList = users;
    });

    this.api.getOperationalRecords(0, 15).subscribe(res => {
      this.operationalRecords = res.records;
      this.totalRecords = res.total;
    });

    this.api.getTrainingStatus().subscribe(status => {
      this.trainingState = status;
    });
  }

  triggerRetrain() {
    this.retrainSuccessMessage = '';
    this.api.triggerTraining().subscribe({
      next: (res) => {
        this.retrainSuccessMessage = res.message || 'Retraining initiated!';
        setTimeout(() => this.loadAdminData(), 3000);
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadDataset() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.uploadSuccessMessage = '';
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.api.uploadDataset(formData, this.resetExisting).subscribe({
      next: (res) => {
        this.uploadSuccessMessage = `${res.message} Ingested ${res.records_ingested} records & updated ${res.stations_updated} stations.`;
        this.uploading = false;
        this.selectedFile = null;
        this.loadAdminData();
      },
      error: (err) => {
        this.uploadSuccessMessage = `Upload error: ${err.error?.detail || 'Failed to ingest file'}`;
        this.uploading = false;
      }
    });
  }
}
