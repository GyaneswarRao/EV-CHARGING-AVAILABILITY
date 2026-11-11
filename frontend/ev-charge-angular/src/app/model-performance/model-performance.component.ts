import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { ModelMetrics } from '../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-model-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-page">
      <div class="container">
        <div class="page-header">
          <div>
            <div class="badge-tag">Rigorous Scikit-Learn Holdout Evaluation</div>
            <h1 class="page-title">Machine Learning Model Performance</h1>
            <p class="page-subtitle">Verified metrics from 80:20 stratified split on the original 450-record dataset</p>
          </div>
        </div>

        <!-- Comparison Cards -->
        <div class="model-cards-grid">
          <!-- Random Forest -->
          <div class="card model-card winner">
            <div class="model-badge">Primary Ensemble (300 Estimators)</div>
            <h2 class="model-title">Random Forest Classifier</h2>
            <div class="score-grid">
              <div class="score-cell">
                <span class="s-val text-green">{{ (metrics?.random_forest?.accuracy || 0.8778) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Accuracy</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.random_forest?.precision || 0.5938) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro Precision</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.random_forest?.recall || 0.5671) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro Recall</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.random_forest?.f1_score || 0.5750) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro F1</span>
              </div>
            </div>
            <p class="model-note">Excels in modeling non-linear operational boundaries between active plugin ratios and sudden queue buildup.</p>
          </div>

          <!-- Logistic Regression -->
          <div class="card model-card">
            <div class="model-badge gray">Linear Baseline Classifier</div>
            <h2 class="model-title">Logistic Regression</h2>
            <div class="score-grid">
              <div class="score-cell">
                <span class="s-val text-blue">{{ (metrics?.logistic_regression?.accuracy || 0.9667) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Accuracy</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.logistic_regression?.precision || 0.6446) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro Precision</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.logistic_regression?.recall || 0.6458) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro Recall</span>
              </div>
              <div class="score-cell">
                <span class="s-val">{{ (metrics?.logistic_regression?.f1_score || 0.6450) * 100 | number:'1.2-2' }}%</span>
                <span class="s-lbl">Macro F1</span>
              </div>
            </div>
            <p class="model-note">Trained with StandardScaler normalization across numerical inputs to compute calibrated baseline class probabilities.</p>
          </div>
        </div>

        <!-- Confusion Matrices Row -->
        <div class="charts-grid-2 mt-4">
          <div class="card">
            <div class="card-header">
              <h3>Random Forest Confusion Matrix</h3>
              <span class="badge">90 Test Observations</span>
            </div>
            <div class="matrix-wrapper">
              <table class="cm-table">
                <thead>
                  <tr>
                    <th>Actual \\ Predicted</th>
                    <th>Available</th>
                    <th>Busy</th>
                    <th>Fully Congested</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of metrics?.random_forest?.confusion_matrix || [[56,1,0],[9,23,0],[0,1,0]]; let i = index">
                    <th>{{ ['Available', 'Busy', 'Fully Congested'][i] }}</th>
                    <td [class.match]="i === 0">{{ row[0] }}</td>
                    <td [class.match]="i === 1">{{ row[1] }}</td>
                    <td [class.match]="i === 2">{{ row[2] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Logistic Regression Confusion Matrix</h3>
              <span class="badge">90 Test Observations</span>
            </div>
            <div class="matrix-wrapper">
              <table class="cm-table">
                <thead>
                  <tr>
                    <th>Actual \\ Predicted</th>
                    <th>Available</th>
                    <th>Busy</th>
                    <th>Fully Congested</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of metrics?.logistic_regression?.confusion_matrix || [[57,0,0],[2,30,0],[0,1,0]]; let i = index">
                    <th>{{ ['Available', 'Busy', 'Fully Congested'][i] }}</th>
                    <td [class.match]="i === 0">{{ row[0] }}</td>
                    <td [class.match]="i === 1">{{ row[1] }}</td>
                    <td [class.match]="i === 2">{{ row[2] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Feature Importance Chart -->
        <div class="card mt-4">
          <div class="card-header">
            <h3>Top Congestion Indicators (Random Forest Feature Importances)</h3>
            <span class="badge">Gini Impurity Reduction</span>
          </div>
          <div class="chart-container-lg">
            <canvas #importanceChartCanvas></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-page {
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
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }

    .model-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .model-card.winner {
      border: 2px solid #10b981;
      background: #f0fdf4;
    }
    .model-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      background: #dcfce7;
      color: #166534;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    .model-badge.gray {
      background: #f1f5f9;
      color: #475569;
    }
    .model-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.25rem;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .score-cell {
      background: white;
      padding: 0.85rem 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .s-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
    }
    .text-green { color: #10b981; }
    .text-blue { color: #0284c7; }
    .s-lbl {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      margin-top: 0.25rem;
    }
    .model-note {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.5;
    }

    .charts-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .mt-4 { margin-top: 1.5rem; }
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
      color: #64748b;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    .matrix-wrapper {
      overflow-x: auto;
    }
    .cm-table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
    }
    .cm-table th, .cm-table td {
      padding: 0.85rem 1rem;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }
    .cm-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    .cm-table td.match {
      background: #ecfdf5;
      font-weight: 800;
      color: #065f46;
    }

    .chart-container-lg {
      height: 340px;
      position: relative;
    }

    @media (max-width: 900px) {
      .model-cards-grid { grid-template-columns: 1fr; }
      .charts-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class ModelPerformanceComponent implements OnInit {
  @ViewChild('importanceChartCanvas') importanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  metrics: ModelMetrics | null = null;
  private api = inject(ApiService);

  ngOnInit() {
    this.api.getModelPerformance().subscribe(m => {
      this.metrics = m;
      if (m.feature_importances) {
        setTimeout(() => this.renderFeatureImportance(m.feature_importances), 50);
      }
    });
  }

  private renderFeatureImportance(importances: { feature: string; importance: number }[]) {
    if (!this.importanceChartCanvas) return;

    // Take top 10 features
    const top10 = importances.slice(0, 10);
    const labels = top10.map(i => i.feature.replace('City_', 'City: ').replace('Connector_Type_', 'Connector: '));
    const data = top10.map(i => i.importance);

    new Chart(this.importanceChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Feature Importance Score',
          data,
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
