// src/app/subscribe1/subscribe1.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

type MatColor = 'primary' | 'accent' | 'warn';

interface Plan {
  PlanCode: string;
  PlanName: string;
  Description: string;
  Price: number;
  Currency: string;
  BillingPeriod: 'Monthly' | 'Yearly' | string;
}

/** Fallback userId when not present */
function normalizeUserIdFromCookie(u: any): string {
  const raw = (u?.alias || u?.email || '').toString();
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  return cleaned || 'GUESTS01';
}

/** Try to get a real userId; fall back to normalized */
function extractUserId(cookieUser: any): string {
  return (
    cookieUser?.userId ??
    cookieUser?.UserId ??
    cookieUser?.UserID ??
    cookieUser?.uid ??
    cookieUser?.UID ??
    normalizeUserIdFromCookie(cookieUser)
  );
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

/** Read the display user from localStorage (ITechJump + TechJump keys) */
function getUserDisplayFromStorage(): any | null {
  try {
    const rawItech = localStorage.getItem('itechjumpUserDisplay');
    const rawTech = localStorage.getItem('techjumpUserDisplay');
    const raw = rawItech || rawTech;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Read user auth from cookie (ljUserAuth contains alias + userId) */
function getUserAuthFromCookie(): any | null {
  try {
    const raw = getCookie('ljUserAuth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-subscribe1',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './subscribe1.component.html',
  styleUrls: ['./subscribe1.component.scss']
})
export class Subscribe1Component {
  // Responsive flags
  isSmDown = signal(false);
  isMdDown = signal(false);

  // User display info - read from cookies first (like header component), then localStorage
  cookieAuthData = getUserAuthFromCookie(); // ljUserAuth cookie
  storageUser = getUserDisplayFromStorage(); // localStorage fallback

  // Get alias from cookie first, then localStorage
  aliasFromCookie = getCookie('useralias')?.trim() ||
                    this.cookieAuthData?.alias?.trim() ||
                    this.storageUser?.alias?.trim() ||
                    '';
  propAlias = ''; // if you ever want to pass alias as @Input later
  realAlias = this.aliasFromCookie || this.propAlias;
  hasRealAlias = !!this.realAlias;
  alias = this.hasRealAlias ? this.realAlias : 'Friend';

  // Get userId from cookie first, then localStorage
  userId = this.cookieAuthData?.userId ||
           this.cookieAuthData?.UserId ||
           extractUserId(this.storageUser);

  // ITechJump plans
  PLANS: Plan[] = [
    {
      PlanCode: 'BASIC-MONTH',
      PlanName: 'Basic',
      Description:
        'Saves answers and scores. Unlocks bonus questions and voice features.',
      Price: 9.99,
      Currency: 'USD',
      BillingPeriod: 'Monthly'
    },
    {
      PlanCode: 'BASIC-YEAR',
      PlanName: 'BasicLT',
      Description:
        'Annual Basic Plan with discounted pricing. Includes saving answers/scores and bonus questions.',
      Price: 59.0,
      Currency: 'USD',
      BillingPeriod: 'Yearly'
    },
    {
      PlanCode: 'FREE-MONTH',
      PlanName: 'Free',
      Description:
        'Access to core questions and testing features. Answers/scores are not saved.',
      Price: 0.0,
      Currency: 'USD',
      BillingPeriod: 'Monthly'
    },
    {
      PlanCode: 'PRO-MONTH',
      PlanName: 'ProSenior',
      Description:
        'Full feature set including advanced analytics, voice mode, and bonus content.',
      Price: 19.99,
      Currency: 'USD',
      BillingPeriod: 'Monthly'
    },
    {
      PlanCode: 'PRO-YEAR',
      PlanName: 'ProYear',
      Description:
        'Annual Pro plan with full features: advanced analytics, bonus questions, and voice mode.',
      Price: 79.99,
      Currency: 'USD',
      BillingPeriod: 'Yearly'
    }
  ];

  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.setupBreakpoints();

    // Debug: Show what's stored
    console.log('=== SUBSCRIBE1 COMPONENT DEBUG ===');
    console.log('localStorage itechjumpUserDisplay:', localStorage.getItem('itechjumpUserDisplay'));
    console.log('localStorage techjumpUserDisplay:', localStorage.getItem('techjumpUserDisplay'));
    console.log('Cookie useralias:', getCookie('useralias'));
    console.log('Cookie ljUserAuth:', getCookie('ljUserAuth'));
    console.log('Cookie ljUserDisplay:', getCookie('ljUserDisplay'));
    console.log('cookieAuthData:', this.cookieAuthData);
    console.log('storageUser:', this.storageUser);
    console.log('Final userId:', this.userId, 'type:', typeof this.userId);
    console.log('Final alias:', this.alias, 'type:', typeof this.alias);
    console.log('=== END DEBUG ===');
  }

  private setupBreakpoints() {
    // Handset
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isSmDown.set(result.matches);
    });

    // Below ~960px (tablet + small desktop)
    this.breakpointObserver
      .observe(['(max-width: 960px)'])
      .subscribe(result => {
        this.isMdDown.set(result.matches);
      });
  }

  // Map plan codes to Angular Material colors
  planColor(code: string): MatColor {
    const c = String(code || '').toUpperCase();
    switch (c) {
      case 'FREE-MONTH':
        return 'primary';
      case 'BASIC-MONTH':
      case 'BASIC-YEAR':
        return 'accent';
      case 'PRO-MONTH':
      case 'PRO-YEAR':
        return 'warn';
      default:
        return 'primary';
    }
  }

  fmtPrice(p: Plan): string {
    if (p.Price <= 0) {
      return 'Free';
    }
    const amount = `$${p.Price.toFixed(2)}`;
    const period =
      p.BillingPeriod.toLowerCase() === 'monthly'
        ? 'month'
        : p.BillingPeriod.toLowerCase() === 'yearly'
        ? 'year'
        : p.BillingPeriod;
    return `${amount}/${period}`;
  }

  fmtBilling(p: Plan): string {
    if (!p.BillingPeriod) return '';
    const b = p.BillingPeriod.toLowerCase();
    if (b === 'monthly') return 'Billed monthly';
    if (b === 'yearly') return 'Billed annually';
    return p.BillingPeriod;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  private setCookie(name: string, value: string, days: number = 365): void {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      const isHttps =
        typeof window !== 'undefined' &&
        window.location &&
        window.location.protocol === 'https:';
      const secure = isHttps ? '; Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(
        value
      )}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
    } catch {
      // no-op if cookies are blocked
    }
  }

  private setSubscriptionCookie(planCode: string, billingPeriod: string) {
    try {
      const now = new Date();
      const startDate = now.toISOString();

      // Calculate end date based on billing period
      const endDate = new Date(now);
      if (billingPeriod.toLowerCase() === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscriptionData = {
        userId: this.userId,
        planCode: planCode,
        billingPeriod: billingPeriod,
        startDate: startDate,
        endDate: endDate.toISOString(),
        subscriptionId: null // Placeholder - will be updated when API returns it
      };

      const value = JSON.stringify(subscriptionData);
      this.setCookie('itechjumpSubscription', value, 365);
      console.log('Subscription cookie set:', subscriptionData);
    } catch (err) {
      console.error('Error setting subscription cookie:', err);
    }
  }

  choosePlan(plan: Plan) {
    // Prepare subscription payload
    const payload = {
      UserId: this.userId,
      UserAlias: this.hasRealAlias ? this.alias : '',
      PlanCode: plan.PlanCode
    };

    console.log('Submitting subscription:', payload);
    console.log('UserId type:', typeof this.userId, 'value:', this.userId);
    console.log('UserAlias type:', typeof this.alias, 'value:', this.alias);

    // Add headers for JSON content
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    // Make API call directly to avoid proxy issues (note: uppercase 'ITechjumpsubscription')
    this.http
      .post<any>('https://techinterviewjump.com/api/ITechjumpsubscription', payload, { headers })
      .subscribe({
        next: (response) => {
          console.log('Subscription response:', response);

          // Set subscription cookie with plan details
          this.setSubscriptionCookie(plan.PlanCode, plan.BillingPeriod);

          // If API returns SubscriptionId, update the cookie
          const subscriptionId = response?.subscription?.SubscriptionId || response?.SubscriptionId;
          if (subscriptionId) {
            try {
              const cookieValue = getCookie('itechjumpSubscription');
              if (cookieValue) {
                const subData = JSON.parse(cookieValue);
                subData.subscriptionId = subscriptionId;
                this.setCookie('itechjumpSubscription', JSON.stringify(subData), 365);
                console.log('Updated subscription cookie with SubscriptionId:', subscriptionId);
              }
            } catch (err) {
              console.error('Error updating subscription cookie:', err);
            }
          }

          // Show success message
          this.snackBar.open('Subscription successful!', undefined, {
            duration: 2000,
            verticalPosition: 'bottom',
            horizontalPosition: 'center',
            panelClass: ['success-snack']
          });

          // Redirect to subscribe2 component with query params
          this.router.navigate(['/subscribe2'], {
            queryParams: {
              planCode: plan.PlanCode,
              userId: this.userId,
              userAlias: this.hasRealAlias ? this.alias : ''
            }
          });
        },
        error: (error) => {
          console.error('Subscription error:', error);

          // Show error message
          this.snackBar.open(
            error?.error?.message || 'Subscription failed. Please try again.',
            'Close',
            {
              duration: 4000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
              panelClass: ['error-snack']
            }
          );
        }
      });
  }
}
