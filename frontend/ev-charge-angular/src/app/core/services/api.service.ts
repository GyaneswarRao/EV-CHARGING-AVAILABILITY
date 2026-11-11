import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Station, StatusSummary, PredictionRequest, PredictionResult, ModelMetrics } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Stations
  getStations(filters?: any): Observable<Station[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Station[]>(`${this.base}/stations`, { params });
  }

  getStationById(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.base}/stations/${id}`);
  }

  getCities(): Observable<{ [city: string]: string[] }> {
    return this.http.get<{ [city: string]: string[] }>(`${this.base}/stations/cities`);
  }

  getStatusSummary(): Observable<StatusSummary> {
    return this.http.get<StatusSummary>(`${this.base}/stations/status-summary`);
  }

  // Prediction
  predict(payload: PredictionRequest): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.base}/predict`, payload);
  }

  getPredictionHistory(limit: number = 50, stationId?: string): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (stationId) params = params.set('station_id', stationId);
    return this.http.get<any[]>(`${this.base}/predict/history`, { params });
  }

  // Analytics
  getAnalyticsOverview(): Observable<any> {
    return this.http.get<any>(`${this.base}/analytics/overview`);
  }

  getCityWiseAnalytics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/analytics/city-wise`);
  }

  getDemandAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.base}/analytics/demand`);
  }

  getPeakHours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/analytics/peak-hours`);
  }

  getFeatureImportance(): Observable<{ feature: string; importance: number }[]> {
    return this.http.get<{ feature: string; importance: number }[]>(`${this.base}/analytics/feature-importance`);
  }

  // ML
  getModelPerformance(): Observable<ModelMetrics> {
    return this.http.get<ModelMetrics>(`${this.base}/ml/model-performance`);
  }

  triggerTraining(): Observable<any> {
    return this.http.post<any>(`${this.base}/ml/train`, {});
  }

  getTrainingStatus(): Observable<any> {
    return this.http.get<any>(`${this.base}/ml/training-status`);
  }

  // Admin
  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/users`);
  }

  getOperationalRecords(skip: number = 0, limit: number = 50): Observable<any> {
    const params = new HttpParams().set('skip', skip.toString()).set('limit', limit.toString());
    return this.http.get<any>(`${this.base}/admin/records`, { params });
  }

  uploadDataset(formData: FormData, resetExisting: boolean = false): Observable<any> {
    const params = new HttpParams().set('reset_existing', resetExisting.toString());
    return this.http.post<any>(`${this.base}/admin/upload-dataset`, formData, { params });
  }

  getAdminLogs(limit: number = 100): Observable<any[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any[]>(`${this.base}/admin/logs`, { params });
  }

  // Real-time Telemetry Simulation
  triggerSimulatedUpdate(stationId: string, activePlugins: number, queueLength: number): Observable<any> {
    const params = new HttpParams()
      .set('station_id', stationId)
      .set('active_plugins', activePlugins.toString())
      .set('queue_length', queueLength.toString());
    return this.http.post<any>(`${this.base}/simulation/trigger-update`, null, { params });
  }
}
