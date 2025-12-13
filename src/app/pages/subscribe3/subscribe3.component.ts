// src/app/subscribe3/subscribe3.component.ts
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

const API_CREATE = 'https://techinterviewjump.com/api/techjumpsubscription';

interface SubscriptionDto {
  SubscriptionId?: number;
  UserId?: number;
  UserAlias?: string;
  PlanCode?: string;
  PlanName?: string;
  Description?: string;
  AutoRenew?: boolean;
  Quantity?: number;
  PriceAtPurchase?: number;
  Currency?: string;
  Status?: string;

  StartUtc?: string;
  CurrentPeriodStartUtc?: string;
  CurrentPeriodEndUtc?: string;
  TrialEndUtc?: string;

  TicketSets?: number;

  CreatedAt?: string;
  UpdatedAt?: string;
}

interface NavigationItem {
  label: string;
  to: string;
  emphasis?: boolean;
}

@Component({
  selector: 'app-subscribe3',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './subscribe3.component.html',
  styleUrls: ['./subscribe3.component.scss']
})
export class Subscribe3Component {
  userId = '';
  userAlias = '';
  planCode = '';

  loading = signal(false);
  error = signal('');
  sub: SubscriptionDto | null = null;

  navigationItems: NavigationItem[] = [
    { label: 'PickPower',  to: '/pick/squarePower',   emphasis: true },
    { label: 'PickMega',   to: '/pick/squareMega',    emphasis: true },
    { label: 'PickTexas',  to: '/pick/squareTexas',   emphasis: true },
    { label: 'PickTwoStep',to: '/pick/squareTwoStep', emphasis: true },
    { label: 'PickCash5',  to: '/pick/squareCash5',   emphasis: true },
    { label: 'Profile',    to: '/profile' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.route.queryParamMap.subscribe(params => {
      this.userId = (params.get('userId') || '').trim();
      this.userAlias = (params.get('userAlias') || '').trim();
      this.planCode = (params.get('planCode') || '').trim();

      this.createSubscription();
    });
  }

  // ---- Helpers (ports of your React helpers) ----

  fmtDate(v: any): string {
    if (!v) return '—';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(v);
      return d.toLocaleString(); // local timezone readable
    } catch {
      return String(v);
    }
  }

  fmtMoney(n: any, currency = 'USD'): string {
    const num = Number(n);
    if (!isFinite(num)) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `$${num.toFixed(2)}`;
    }
  }

  statusClass(status: string | undefined): string {
    const v = String(status || '').toLowerCase();
    if (v === 'active') return 'status-active';
    if (v === 'trialing') return 'status-trialing';
    if (v === 'canceled' || v === 'ended') return 'status-ended';
    return 'status-default';
  }

  get hdrPlan(): string {
    return this.sub?.PlanCode || this.planCode || '—';
  }

  get hdrName(): string {
    return this.sub?.PlanName || 'Subscription Created';
  }

  // ---- API call (port of useEffect) ----

  private createSubscription(): void {
    const body = {
      UserId: Number(this.userId || 0),
      UserAlias: this.userAlias,
      PlanCode: (this.planCode || '').toUpperCase()
    };

    // Basic guard before calling API (same as React version)
    if (!body.UserId || !body.UserAlias || !body.PlanCode) {
      this.error.set('Missing required fields. Please go back and confirm your plan.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.sub = null;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    this.http.post<any>(API_CREATE, body, { headers }).subscribe({
      next: (res) => {
        const created = res?.subscription || null;
        this.sub = created;
      },
      error: (err) => {
        const statusText = err?.status ? `HTTP ${err.status} ${err.statusText || ''}` : '';
        const bodyText = err?.error ? (typeof err.error === 'string' ? err.error : '') : '';
        const message = err?.message || 'Request failed.';
        const combined =
          statusText || bodyText
            ? `${statusText}${bodyText ? ` – ${bodyText}` : ''}`
            : message;
        this.error.set(combined || 'Request failed.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  // ---- Navigation ----

  onNavigate(path: string) {
    this.router.navigate([path]);
  }
}
