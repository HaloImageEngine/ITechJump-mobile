// src/app/subscribe2/subscribe2.component.ts
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

type MatColor = 'primary' | 'accent' | 'warn';

interface ApiPlan {
  PlanCode: string;
  PlanName: string;
  Description: string;
  SubscriptionId?: number;
  Price: number;
  PlanStartDate?: string;
  PlanEndDate?: string;
  BillingPeriod?: string;
  MinNumbers: number | null;
  MaxNumbers: number | null;
  TicketSets: number | null;
  IsActive: boolean;
}

/** Map plan codes to Angular Material colors (approx MUI colors) */
function planMuiColorMat(code: string): MatColor {
  const c = String(code || '').toLowerCase();
  switch (c) {
    case 'free':
      return 'accent';   // MUI "success" → accent-ish
    case 'basic12':
    case 'basic36':
      return 'primary';
    case 'basic90':
      return 'warn';     // MUI "warning" → warn
    case 'pro120':
      return 'accent';   // MUI "info" → accent-ish
    default:
      return 'primary';
  }
}

/** Fallback userId if not provided */
function normalizeUserIdFromCookie(u: any): string {
  const raw = (u?.alias || u?.email || '').toString();
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  return cleaned || 'GUESTS01';
}

/** Try to get a real numeric userId from cookies */
function extractUserId(cookieUser: any, qsUserId: string): string {
  if (qsUserId) return qsUserId;

  // First, try to get userId from ljUserAuth cookie
  const authCookie = getUserAuthFromCookie();
  if (authCookie?.userId && !isNaN(Number(authCookie.userId))) {
    return String(authCookie.userId);
  }

  // Then try to get userId from cookieUser (localStorage)
  const userId = cookieUser?.userId ??
    cookieUser?.UserId ??
    cookieUser?.UserID ??
    cookieUser?.uid ??
    cookieUser?.UID;

  // Only return if it's a valid numeric userId
  if (userId && !isNaN(Number(userId))) {
    return String(userId);
  }

  return ''; // Return empty string if no valid userId found
}/** Read display user from localStorage (itechjump + ITechJump keys) */
function getUserDisplayFromStorage(): any | null {
  try {
    const rawtech = localStorage.getItem('itechjumpUserDisplay');
    const rawItech = localStorage.getItem('itechjumpUserDisplay');
    const raw = rawtech || rawItech;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Read a cookie by name */
function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(name + '='));
    if (!match) return null;
    return decodeURIComponent(match.substring(name.length + 1));
  } catch {
    return null;
  }
}

/** Read subscription from cookie */
function getSubscriptionFromCookie(): any | null {
  try {
    const raw = getCookie('itechjumpSubscription');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Read ljUserAuth cookie for userId */
function getUserAuthFromCookie(): any | null {
  try {
    const raw = getCookie('ljUserAuth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const API_BASE = 'https://techinterviewjump.com/api/ITechjumpsubscription/userid/';

@Component({
  selector: 'app-subscribe2',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './subscribe2.component.html',
  styleUrls: ['./subscribe2.component.scss']
})
export class Subscribe2Component {
  // Query params
  planCodeFromQuery = '';
  qsUserAlias = '';
  qsUserId = '';

  // Cookie/localStorage user info
  cookieUser = getUserDisplayFromStorage();
  fallbackAlias = (this.cookieUser?.alias || this.cookieUser?.email || '').trim();
  userAlias = '';
  userId = '';

  // API-loaded plan
  apiPlan: ApiPlan | null = null;
  loading = signal(false);
  error = signal('');

  // Subscription dates
  subscriptionStartDate: string = '';
  subscriptionEndDate: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    console.log('=== SUBSCRIBE2 CONSTRUCTOR DEBUG ===');
    console.log('localStorage getUserDisplayFromStorage:', this.cookieUser);
    console.log('ljUserAuth cookie:', getUserAuthFromCookie());
    console.log('itechjumpSubscription cookie:', getSubscriptionFromCookie());
    console.log('=== END CONSTRUCTOR DEBUG ===');

    this.route.queryParamMap.subscribe(params => {
      this.planCodeFromQuery = (params.get('planCode') || '').trim();
      this.qsUserAlias = (params.get('userAlias') || '').trim();
      this.qsUserId = (params.get('userId') || '').trim();

      // If no query params, try to get from subscription cookie
      if (!this.planCodeFromQuery && !this.qsUserId) {
        const subCookie = getSubscriptionFromCookie();
        console.log('No query params - loading from subscription cookie:', subCookie);

        if (subCookie) {
          this.planCodeFromQuery = subCookie.planCode || '';
          this.qsUserId = String(subCookie.userId || '');
          // Populate dates from cookie if available
          if (subCookie.startDate) {
            const startDate = new Date(subCookie.startDate);
            this.subscriptionStartDate = startDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
          if (subCookie.endDate) {
            const endDate = new Date(subCookie.endDate);
            this.subscriptionEndDate = endDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
          console.log('Loaded from cookie - planCode:', this.planCodeFromQuery, 'userId:', this.qsUserId);
        }
      }

      // Get userAlias from query params, ljUserAuth cookie, or localStorage fallback
      const authCookie = getUserAuthFromCookie();
      this.userAlias = this.qsUserAlias || authCookie?.alias || this.fallbackAlias;
      this.userId = extractUserId(this.cookieUser, this.qsUserId);

      console.log('Final userAlias:', this.userAlias);
      console.log('Final userId:', this.userId);

      this.loadPlan();
    });
  }

  /** Format yearly price like React fmtPriceYear */
  fmtPriceYear(n: number | null | undefined): string {
    const num = Number(n || 0);
    return num <= 0 ? 'Free/year' : `$${num.toFixed(2)}/year`;
  }

  get displayPlanCode(): string {
    return this.apiPlan?.PlanCode || this.planCodeFromQuery || '(none)';
  }

  get displayPlanName(): string {
    return this.apiPlan?.PlanName || '[ PLAN NAME ]';
  }

  get displayDescription(): string {
    return this.apiPlan?.Description || '[ PLAN DESCRIPTION ]';
  }

  get displayPrice(): string {
    return this.fmtPriceYear(this.apiPlan?.Price);
  }

  get displayMin(): string {
    const v = this.apiPlan?.MinNumbers;
    return v === null || v === undefined ? '—' : String(v);
  }

  get displayMax(): string {
    const v = this.apiPlan?.MaxNumbers;
    return v === null || v === undefined ? '—' : String(v);
  }

  get displaySets(): string {
    const v = this.apiPlan?.TicketSets;
    return v === null || v === undefined ? '—' : String(v);
  }

  get isActive(): boolean {
    return this.apiPlan?.IsActive === true;
  }

  planColor(code: string): MatColor {
    return planMuiColorMat(code);
  }

  /** Load plan from API when planCode is available */
  private loadPlan() {
    const userIdVal = this.userId || '0';

    console.log('=== SUBSCRIBE2 LOADING PLAN ===');
    console.log('User ID:', userIdVal);
    console.log('Plan code:', this.planCodeFromQuery);

    // Check if we have a valid numeric userId
    const numericUserId = Number(userIdVal);
    if (!userIdVal || isNaN(numericUserId) || numericUserId < 1000) {
      console.warn('Invalid or missing userId:', userIdVal);
      this.error.set('Please log in or subscribe to view your subscription details.');
      this.loading.set(false);
      return;
    }

    const url = `${API_BASE}${encodeURIComponent(userIdVal)}`;
    console.log('API URL:', url);

    this.loading.set(true);
    this.error.set('');
    this.apiPlan = null;

    this.http.get<any>(url, { headers: { Accept: 'application/json' } }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        this.apiPlan = res?.subscription ?? null;
        console.log('Extracted apiPlan:', this.apiPlan);
        console.log('PlanStartDate:', this.apiPlan?.PlanStartDate);
        console.log('PlanEndDate:', this.apiPlan?.PlanEndDate);
        console.log('BillingPeriod:', this.apiPlan?.BillingPeriod);
        console.log('=== END SUBSCRIBE2 ===');

        // Format subscription dates from API
        this.formatSubscriptionDates();
      },
      error: (err) => {
        console.error('API Error:', err);
        const msg = err?.message || 'Request failed.';
        this.error.set(`Unable to load subscription for user "${userIdVal}". ${msg}`);
        this.apiPlan = null;
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  backToPlans() {
    this.router.navigate(['/subscribe1']);
  }

  private formatSubscriptionDates() {
    // Format dates from API response
    if (this.apiPlan?.PlanStartDate) {
      const startDate = new Date(this.apiPlan.PlanStartDate);
      this.subscriptionStartDate = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      this.subscriptionStartDate = 'Not available';
    }

    if (this.apiPlan?.PlanEndDate) {
      const endDate = new Date(this.apiPlan.PlanEndDate);
      this.subscriptionEndDate = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      this.subscriptionEndDate = 'Not available';
    }
  }

  handleContinue() {
    const planCodeUpper = (this.displayPlanCode || this.planCodeFromQuery || '').toUpperCase();
    this.router.navigate(['/subscribe/plan/s3'], {
      queryParams: {
        userId: String(this.userId || ''),
        userAlias: String(this.userAlias || ''),
        planCode: planCodeUpper
      }
    });
  }
}
