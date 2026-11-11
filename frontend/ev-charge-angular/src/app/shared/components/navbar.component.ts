import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="nav-brand">
          <div class="logo-icon">⚡</div>
          <span class="brand-text">EV<span class="text-emerald">CHARGE</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">Dashboard</a>
          <a routerLink="/stations" routerLinkActive="active" class="nav-item">Stations</a>
          <a routerLink="/map" routerLinkActive="active" class="nav-item">Map</a>
          <a routerLink="/predict" routerLinkActive="active" class="nav-item">AI Predictor</a>
          <a routerLink="/analytics" routerLinkActive="active" class="nav-item">Analytics</a>
          <a routerLink="/model-performance" routerLinkActive="active" class="nav-item">ML Metrics</a>
          
          <ng-container *ngIf="auth.isAuthenticated">
            <a routerLink="/history" routerLinkActive="active" class="nav-item">History</a>
            <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" class="nav-item admin-badge">Admin</a>
          </ng-container>
        </div>

        <div class="nav-actions">
          <ng-container *ngIf="!auth.isAuthenticated">
            <a routerLink="/auth/login" class="btn btn-outline">Sign In</a>
            <a routerLink="/auth/register" class="btn btn-primary">Get Started</a>
          </ng-container>

          <ng-container *ngIf="auth.isAuthenticated">
            <div class="user-chip">
              <div class="user-avatar">{{ (auth.currentUserValue?.name || 'U').charAt(0) }}</div>
              <span class="user-name">{{ auth.currentUserValue?.name }}</span>
            </div>
            <button (click)="logout()" class="btn btn-outline-danger">Sign Out</button>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 4.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .logo-icon {
      width: 2.25rem;
      height: 2.25rem;
      background: #10b981;
      color: white;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
    }
    .brand-text {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #0f172a;
    }
    .text-emerald {
      color: #10b981;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-item {
      padding: 0.5rem 0.85rem;
      border-radius: 0.375rem;
      font-size: 0.925rem;
      font-weight: 500;
      color: #475569;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .nav-item:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .nav-item.active {
      color: #059669;
      background: #ecfdf5;
      font-weight: 600;
    }
    .admin-badge {
      background: #fef3c7;
      color: #b45309 !important;
      font-weight: 600;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
    }
    .user-avatar {
      width: 1.75rem;
      height: 1.75rem;
      background: #0ea5e9;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: #10b981;
      color: white;
    }
    .btn-primary:hover {
      background: #059669;
    }
    .btn-outline {
      border: 1px solid #cbd5e1;
      color: #334155;
      background: transparent;
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-outline-danger {
      border: 1px solid #fecaca;
      color: #dc2626;
      background: transparent;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
    }
    @media (max-width: 900px) {
      .nav-links {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
