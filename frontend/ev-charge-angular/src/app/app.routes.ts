import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StationsExplorerComponent } from './stations/stations-explorer.component';
import { StationMapComponent } from './map/station-map.component';
import { PredictionComponent } from './prediction/prediction.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { ModelPerformanceComponent } from './model-performance/model-performance.component';
import { PredictionHistoryComponent } from './history/prediction-history.component';
import { AdminPanelComponent } from './admin/admin-panel.component';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'stations', component: StationsExplorerComponent },
  { path: 'map', component: StationMapComponent },
  { path: 'predict', component: PredictionComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'model-performance', component: ModelPerformanceComponent },
  { path: 'history', component: PredictionHistoryComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
