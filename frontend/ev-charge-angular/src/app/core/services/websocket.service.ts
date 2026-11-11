import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TelemetryUpdate {
  type: string;
  station_id: string;
  active_plugins: number;
  queue_length: number;
  current_status: 'Available' | 'Busy' | 'Fully Congested';
  is_simulated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private updateSubject = new Subject<TelemetryUpdate>();
  public updates$: Observable<TelemetryUpdate> = this.updateSubject.asObservable();
  public isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(environment.wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('Real-Time Simulation WebSocket connected.');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATION_TELEMETRY_UPDATE') {
            this.updateSubject.next(data as TelemetryUpdate);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 4 seconds
        setTimeout(() => this.connect(), 4000);
      };

      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {
      this.isConnected = false;
    }
  }

  public send(msg: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }
}
