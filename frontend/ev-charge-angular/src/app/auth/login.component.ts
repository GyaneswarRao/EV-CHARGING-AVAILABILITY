import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">⚡</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your EV Charge dashboard</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="email" 
              required 
              placeholder="name@example.com"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              required 
              placeholder="••••••••"
              class="form-control"
            />
          </div>

          <button type="submit" [disabled]="loading || !loginForm.form.valid" class="btn-submit">
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-box">
          <span class="demo-title">Quick Demo Login:</span>
          <button (click)="fillAdminCredentials()" class="btn-demo">Admin: admin&#64;evcharge.com</button>
        </div>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Create Account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 4.25rem);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background: #f8fafc;
    }
    .auth-card {
      background: white;
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      border-radius: 1.25rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      background: #10b981;
      color: white;
      font-size: 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
    }
    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .auth-header p {
      color: #64748b;
      font-size: 0.9rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }
    .form-control {
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .btn-submit {
      margin-top: 0.5rem;
      padding: 0.85rem;
      background: #10b981;
      color: white;
      font-weight: 600;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      background: #059669;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert-error {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .demo-box {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 0.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .demo-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-demo {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.825rem;
      cursor: pointer;
      color: #0f172a;
      font-weight: 600;
    }
    .btn-demo:hover {
      background: #e2e8f0;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.9rem;
      color: #64748b;
    }
    .auth-footer a {
      color: #10b981;
      font-weight: 600;
      text-decoration: none;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fillAdminCredentials() {
    this.email = 'admin@evcharge.com';
    this.password = 'Password123!';
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Login failed. Please verify credentials.';
        this.loading = false;
      }
    });
  }
}
