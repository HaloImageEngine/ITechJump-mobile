// src/app/subscribe1/subscribe1.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, Inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { ItechjumpApiService } from '../../core/services/itechjump-api.service';

type MatColor = 'primary' | 'accent' | 'warn';

interface Plan {
  // Core display fields used in the grid
  PlanCode: string;
  PlanName: string;
  Description: string;
  Price: number;
  Currency: string;
  BillingPeriod: 'Monthly' | 'Yearly' | string;

  // Fields coming from the Stripe products API
  ProductID?: number;
  StripeProductId?: string;
  StripePriceId?: string;
  ProductTaxCode?: string;
  BillingInterval?: string;
  IsActive?: boolean;
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
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './subscribe1.component.html',
  styleUrls: ['./subscribe1.component.scss']
})
export class Subscribe1Component implements OnInit {
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

  // Get userEmail from cookies/localStorage and validate basic email shape
  userEmail: string = (() => {
    try {
      let email = '';

      // 1) Try ljUserDisplay cookie
      const displayCookie = getCookie('ljUserDisplay');
      if (displayCookie) {
        const displayData = JSON.parse(displayCookie);
        email = displayData.email || '';
      }

      // 2) Fallback to storageUser (itechjumpUserDisplay / techjumpUserDisplay)
      if (!email && this.storageUser) {
        email = this.storageUser.email || '';
      }

      // 3) Fallback to a generic useremail cookie if present
      if (!email) {
        const emailCookie = getCookie('useremail');
        if (emailCookie) {
          email = emailCookie;
        }
      }

      email = (email || '').trim();

      // Very basic email validation: must contain "@" and a dot after it
      const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!simpleEmailRegex.test(email)) {
        return '';
      }

      return email;
    } catch {
      return '';
    }
  })();

  // ITechJump plans loaded dynamically from REST API
  PLANS: Plan[] = [];

  // UI state for loading/error when fetching plans
  isLoadingPlans = false;
  loadPlansError: string | null = null;

  private stripe: Stripe | null = null;
  private dialog = inject(MatDialog);
  private api = inject(ItechjumpApiService);

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

  async ngOnInit() {
    // Initialize Stripe
    this.stripe = await loadStripe(environment.stripePublishableKey);
    if (!this.stripe) {
      console.error('Failed to load Stripe');
    }

    // Load subscription plans from backend
    this.loadYearlyPlans();
  }

  // ---- User context validation helpers ----

  private isUserIdValid(): boolean {
    const n = Number(this.userId);
    return Number.isInteger(n) && n > 0;
  }

  private isAliasValid(): boolean {
    const a = (this.alias || '').trim();
    const len = a.length;
    return len > 6 && len < 20;
  }

  /**
   * User context is valid only if we have a numeric userId, a
   * reasonably sized alias, and a validated non-empty userEmail.
   */
  isUserContextValid(): boolean {
    return this.isUserIdValid() && this.isAliasValid() && !!this.userEmail;
  }

  /**
   * Human-readable explanation of why the user context is invalid,
   * used for hover tooltips on disabled plan buttons.
   */
  getUserContextInvalidMessage(): string {
    const reasons: string[] = [];

    if (!this.isUserIdValid()) {
      reasons.push('UserId must be a positive whole number.');
    }

    if (!this.isAliasValid()) {
      reasons.push('UserAlias must be between 7 and 19 characters.');
    }

    if (!this.userEmail) {
      reasons.push('UserEmail must be a valid email address.');
    }

    if (!reasons.length) {
      return 'Please complete your registration before choosing a plan.';
    }

    return reasons.join(' ');
  }

  /**
   * Load subscription products for yearly billing interval from REST API
   * and map them into the local Plan[] used by the template.
   */
  private loadYearlyPlans() {
    this.isLoadingPlans = true;
    this.loadPlansError = null;

    const url =
      'https://techinterviewjump.com/api/ITechJump/stripe/GetProductYearly?BillingInterval=year';

    this.http.get<any[]>(url).subscribe({
      next: (products) => {
        if (!Array.isArray(products)) {
          console.error('Unexpected plans payload (not an array):', products);
          return;
        }

        this.PLANS = products
          .filter((p) => p && (p.IsActive === undefined || p.IsActive === true))
          .map((p): Plan => {
            const intervalRaw = String(p.BillingInterval || '').toLowerCase();
            let billingPeriod: 'Monthly' | 'Yearly' | string = p.BillingInterval || '';
            if (intervalRaw === 'year' || intervalRaw === 'yearly') {
              billingPeriod = 'Yearly';
            } else if (intervalRaw === 'month' || intervalRaw === 'monthly') {
              billingPeriod = 'Monthly';
            }

            return {
              PlanCode: p.PlanCode,
              PlanName: p.ProductName,
              Description: p.ProductDescription,
              Price: p.Price,
              Currency: p.Currency || 'USD',
              BillingPeriod: billingPeriod,
              ProductID: p.ProductID,
              StripeProductId: p.StripeProductId,
              StripePriceId: p.StripePriceId,
              ProductTaxCode: p.ProductTaxCode,
              BillingInterval: p.BillingInterval,
              IsActive: p.IsActive
            };
          });

        console.log('Loaded subscription plans from API:', this.PLANS);
        this.isLoadingPlans = false;
      },
      error: (err) => {
        console.error('Failed to load subscription plans from API:', err);
        this.isLoadingPlans = false;
        this.loadPlansError = 'Unable to load subscription plans. Please check your connection and try again.';
        this.snackBar.open('Unable to load subscription plans. Please try again later.', 'Close', {
          duration: 4000
        });
      }
    });
  }

  retryLoadPlans() {
    this.loadYearlyPlans();
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
    // Skip payment for free plan
    if (plan.Price <= 0) {
      // Even for free plans, require a valid user context so
      // downstream subscription records are associated correctly.
      if (!this.isUserContextValid()) {
        console.error('Cannot activate free plan: user context is invalid', {
          userId: this.userId,
          alias: this.alias,
          userEmail: this.userEmail
        });
        this.snackBar.open(
          'Please complete your registration (valid UserId, alias, and email) before choosing a plan.',
          'Close',
          { duration: 6000 }
        );
        return;
      }

      this.createFreeSubscription(plan);
      return;
    }

    // Guard: require a StripePriceId for paid plans before calling backend
    if (!plan.StripePriceId) {
      console.error('Paid plan is missing StripePriceId:', plan);
      this.snackBar.open(
        'This plan is not yet configured for online checkout. Please choose another plan or try again later.',
        'Close',
        { duration: 5000 }
      );
      return;
    }

    // Guard: ensure the full user context is valid for paid checkout
    if (!this.isUserContextValid()) {
      console.error('Cannot start checkout: user context is invalid', {
        userId: this.userId,
        alias: this.alias,
        userEmail: this.userEmail
      });
      this.snackBar.open(
        'Please complete your registration (valid UserId, alias, and email) before starting payment.',
        'Close',
        { duration: 6000 }
      );
      return;
    }

    // Hosted Stripe Checkout for paid plans
    console.log('Starting hosted Stripe Checkout for plan:', plan.PlanCode);

    const checkoutPayload = {
      userId: this.userId || 0,
      userAlias: this.hasRealAlias ? this.alias : '',
      userEmail: this.userEmail,
      // Send the StripePriceId for this product to the backend (no hard-coded price ids)
      planCode: plan.StripePriceId
    };

    console.log(
      'Calling createCheckoutSession with payload JSON:',
      JSON.stringify(checkoutPayload, null, 2)
    );

    this.api
      .createCheckoutSession(checkoutPayload)
      .subscribe({
        next: async (session) => {
          console.log('Checkout Session created (raw):', session);

          // Support multiple possible shapes from backend and also
          // handle the case where backend returns JSON as a string.
          let anySession: any = session as any;
          if (typeof anySession === 'string') {
            try {
              anySession = JSON.parse(anySession);
              console.log('Parsed string session JSON:', anySession);
            } catch (e) {
              console.error('Failed to parse session string as JSON:', e);
            }
          }

          // If backend indicates failure explicitly, surface message and stop.
          if (anySession.ok === false) {
            const msg =
              anySession.error ||
              anySession.message ||
              'Payment session could not be created. Please try again.';
            console.error('Checkout session not ok:', anySession);
            this.snackBar.open(msg, 'Close', { duration: 4000 });
            return;
          }

          const sessionUrl: string | undefined = anySession.url || anySession.checkoutUrl;
          const sessionId: string | undefined =
            anySession.id || anySession.sessionId || anySession.checkoutSessionId;

          // If backend returns a direct URL, use it
          if (sessionUrl) {
            console.log('Redirecting to Checkout URL:', sessionUrl);
            window.location.href = sessionUrl;
            return;
          }

          // Otherwise, use Stripe.js redirectToCheckout with sessionId
          if (!sessionId) {
            console.error('No session URL or sessionId returned from backend:', anySession);
            this.snackBar.open('Payment session could not be created. Please try again.', 'Close', {
              duration: 4000
            });
            return;
          }

          const stripeInstance = await loadStripe(environment.stripePublishableKey);
          if (!stripeInstance) {
            console.error('Failed to load Stripe for redirectToCheckout');
            this.snackBar.open('Unable to open payment page. Please try again.', 'Close', {
              duration: 4000
            });
            return;
          }

          // Cast to any to avoid type conflicts if multiple Stripe typings are present
          const { error } = await (stripeInstance as any).redirectToCheckout({ sessionId });
          if (error) {
            console.error('redirectToCheckout error:', error);
            this.snackBar.open(error.message || 'Redirect to payment failed.', 'Close', {
              duration: 4000
            });
          }
        },
        error: (err) => {
          console.error('createCheckoutSession error:', err);
          this.snackBar.open('Unable to start checkout. Please try again.', 'Close', {
            duration: 4000
          });
        }
      });
  }

  private createFreeSubscription(plan: Plan) {
    const payload = {
      UserId: this.userId || 0,
      UserAlias: this.hasRealAlias ? this.alias : '',
      PlanCode: plan.PlanCode,
      StripePaymentIntentId: '',
      StripeChargeId: '',
      StripeCustomerId: '',
      StripePaymentMethodId: ''
    };

    this.api.createSubscription(payload).subscribe({
      next: (response) => {
        console.log('Free subscription response:', response);
        this.setSubscriptionCookie(plan.PlanCode, plan.BillingPeriod);

        this.snackBar.open('Free plan activated!', undefined, {
          duration: 2000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center'
        });

        this.router.navigate(['/subscribe2'], {
          queryParams: {
            planCode: plan.PlanCode,
            userId: this.userId,
            userAlias: this.hasRealAlias ? this.alias : ''
          }
        });
      },
      error: (error) => {
        console.error('Free subscription error:', error);
        this.snackBar.open('Failed to activate free plan. Please try again.', 'Close', {
          duration: 4000
        });
      }
    });
  }
}

// Stripe Payment Dialog Component
@Component({
  selector: 'app-stripe-payment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './stripe-payment-dialog.html',
  styles: [`
    .payment-info {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .card-element-container {
      margin: 20px 0;
    }
    #card-element {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 12px;
      background-color: white;
    }
    #card-errors {
      color: #f44336;
      margin-top: 8px;
      font-size: 14px;
    }
    .processing {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      color: #666;
    }
    .error-message {
      color: #f44336;
      margin-top: 12px;
      padding: 12px;
      background-color: #ffebee;
      border-radius: 4px;
    }
  `]
})
export class StripePaymentDialogComponent implements OnInit {
  processing = signal(false);
  errorMessage = signal<string | null>(null);

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<StripePaymentDialogComponent>,
    private api: ItechjumpApiService
  ) {}

  async ngOnInit() {
    // Initialize Stripe
    this.stripe = await loadStripe(environment.stripePublishableKey);
    if (!this.stripe) {
      this.errorMessage.set('Failed to load payment system');
      return;
    }

    // Create Stripe Elements
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    // Mount card element
    this.cardElement.mount('#card-element');

    // Handle real-time validation errors
    this.cardElement.on('change', (event) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        displayError.textContent = event.error ? event.error.message : '';
      }
    });
  }

  async handlePayment() {
    if (!this.stripe || !this.cardElement) {
      this.errorMessage.set('Payment system not initialized');
      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);

    try {
      // Step 1: Create a PaymentMethod from the card details
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.data.userAlias || 'Customer'
        }
      });

      if (error || !paymentMethod) {
        this.errorMessage.set(error?.message || 'Failed to create payment method');
        this.processing.set(false);
        return;
      }

      const paymentMethodId = paymentMethod.id;
      console.log('Payment method created:', paymentMethodId);

      // Step 2: Call backend consolidated Stripe payment endpoint
      const payload = {
        UserId: this.data.userId || 0,
        UserAlias: this.data.userAlias || '',
        PlanCode: this.data.plan.PlanCode,
        StripePaymentIntentId: '',
        StripeChargeId: '',
        StripeCustomerId: '',
        StripePaymentMethodId: paymentMethodId
      };

      console.log('Calling CallStripePayment with payload JSON:', JSON.stringify(payload, null, 2));

      this.api.callStripePayment(payload).subscribe({
        next: (response) => {
          console.log('stripe/call-payment response:', response);

          // Backend may return { ok: false, ... } for non-succeeded statuses
          if (response && response.ok === false) {
            const msg =
              response.error ||
              response.status ||
              'Payment failed. Please verify your card and try again.';
            this.errorMessage.set(msg);
            this.processing.set(false);
            return;
          }

          this.processing.set(false);
          this.dialogRef.close({ success: true, response });
        },
        error: (err) => {
          console.error('stripe/call-payment error:', err);
          const msg = err?.error?.error || err?.error?.message || 'Payment processing failed';
          this.errorMessage.set(msg);
          this.processing.set(false);
        }
      });

    } catch (err: any) {
      console.error('Payment error:', err);
      this.errorMessage.set(err.message || 'Payment processing failed');
      this.processing.set(false);
    }
  }
}
