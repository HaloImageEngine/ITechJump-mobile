import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../../core/services/logger.service';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

// 🔒 DEV BACKDOOR — hardcoded password (REMOVE before production)
const DEV_BACKDOOR_PASSWORD = 'halohalo500';

// API
const API_BASE = 'https://techinterviewjump.com';
const VERIFY_ALIAS_URL = `${API_BASE}/api/Techjump/login/verify-alias`; // POST JSON: { Alias, Password }

// "Non-expiring" persistent cookie (approx. 20 years)
const PERSISTENT_COOKIE_DAYS = 365 * 20;

interface VerifyAliasResponse {
  ok?: boolean;
  userId?: number | string;
  message?: string;
  error?: string;
  [key: string]: any;
}

@Component({
  standalone: true,
  selector: 'lj-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private logger = inject(LoggerService);

  form: FormGroup = this.fb.group({
    aliasOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  // Signals for UI state
  mode = signal<'alias' | 'email'>('alias');
  loading = signal(false);
  error = signal<string | null>(null);
  aliasError = signal<string | null>(null);
  showPassword = signal(false);
  cookieExists = signal(false);
  buttonLabel = signal<'Login' | 'Register'>('Login');

  // Two-way binding for LG checkbox
  redirectToLogin = false;

  // Derived label for alias/email field
  aliasLabel = computed(() =>
    this.mode() === 'alias'
      ? 'User Alias (6 letters + 2 numbers)'
      : 'User Email'
  );

  constructor() {
    // Check if login cookie exists on component init
    this.checkLoginCookie();

    // Live validation / normalization for alias input
    const aliasControl = this.form.get('aliasOrEmail');
    if (aliasControl) {
      aliasControl.valueChanges.subscribe((rawVal) => {
        const currentMode = this.mode();

        if (currentMode === 'alias') {
          const normalized = this.normalizeAlias(rawVal || '');
          if (normalized !== rawVal) {
            // Update without emitting again to avoid loops
            aliasControl.setValue(normalized, { emitEvent: false });
          }
          this.runAliasValidation(normalized);
        } else {
          // Email mode: no alias rules
          this.aliasError.set(null);
        }
      });
    }
  }

  // --- Helpers ---------------------------------------------------------------

  private checkLoginCookie(): void {
    try {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('ljUserAuth='));
      this.cookieExists.set(!!authCookie);
    } catch {
      this.cookieExists.set(false);
    }
  }

  private normalizeAlias(v: string): string {
    return v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }

  private validateAlias(a: string) {
    const clean = a || '';
    const lenOk = clean.length === 8;
    const alnumOk = /^[A-Z0-9]{8}$/.test(clean);
    const digits = (clean.match(/\d/g) || []).length;
    const letters = (clean.match(/[A-Z]/g) || []).length;
    const digitOk = digits === 2;
    const letterOk = letters === 6;
    const valid = lenOk && alnumOk && digitOk && letterOk;
    return { valid, lenOk, alnumOk, digitOk, letterOk };
  }

  // Derive an 8-char alias from an email if needed (letters only + '01')
  private deriveAliasFromEmail(email: string): string {
    const local = (email || '')
      .split('@')[0]
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const base = local.padEnd(6, 'X').slice(0, 6);
    return base + '01';
  }

  private runAliasValidation(alias: string) {
    if (!alias) {
      this.aliasError.set(null);
      return;
    }

    const { valid, lenOk, alnumOk, digitOk, letterOk } = this.validateAlias(alias);

    if (valid) {
      this.aliasError.set(null);
      return;
    }

    let msg = 'Please use 6 alpha and 2 numbers for a total of 8 Characters.';
    if (!lenOk) {
      msg = 'Alias must be exactly 8 characters.';
    } else if (!alnumOk) {
      msg = 'Letters and numbers only (A–Z, 0–9).';
    }

    this.aliasError.set(msg);

    // Immediate pop when length is 8 but invalid mix
    if (lenOk && (!digitOk || !letterOk || !alnumOk)) {
      this.snackBar.open(
        'Please use 6 alpha and 2 numbers for a total of 8 Characters.',
        'OK',
        { duration: 1600, verticalPosition: 'bottom', horizontalPosition: 'center' }
      );
    }
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

  private getCookie(name: string): string | null {
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

  private setUserDisplayCookie(payload: { alias: string; email?: string | null; userId?: string | number }) {
    try {
      const value = JSON.stringify({
        alias: payload.alias,
        email: payload.email ?? null,
        userId: Number(payload.userId) || 0  // Store as number
      });
      // UI display cookie (1 year is fine)
      this.setCookie('ljUserDisplay', value, 365);
    } catch {
      // swallow
    }
  }

  /**
   * Persistent auth cookie that the rest of the app can read.
   * Stores alias + userId in JSON, with a very long expiry.
   */
  private setUserAuthCookie(alias: string, userId: string | number): void {
    try {
      const value = JSON.stringify({
        alias,
        userId: Number(userId) || 0  // Store as number
      });
      // Approx. "does not expire" by using a 20-year expiry
      this.setCookie('ljUserAuth', value, PERSISTENT_COOKIE_DAYS);
      // Update CE checkbox after setting cookie
      this.cookieExists.set(true);
    } catch {
      // swallow
    }
  }

  private doPostLoginUI(aliasCookie: string, emailCookie: string | null, userIdVal: string | number) {
    this.logger.log('=== doPostLoginUI ===');
    this.logger.log('Received userIdVal:', userIdVal, 'type:', typeof userIdVal);

    // Convert userId to number
    const userIdNum = Number(userIdVal) || 0;
    this.logger.log('Converted to userIdNum:', userIdNum, 'type:', typeof userIdNum);

    // If no email provided, try to preserve existing email from localStorage or cookies
    let finalEmail = emailCookie;
    if (!finalEmail) {
      try {
        // Check localStorage first
        const stored = localStorage.getItem('techjumpUserDisplay');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.email && data.alias === aliasCookie) {
            finalEmail = data.email;
            this.logger.log('Preserved email from localStorage:', finalEmail);
          }
        }

        // If still no email, check ljUserDisplay cookie
        if (!finalEmail) {
          const cookieStr = this.getCookie('ljUserDisplay');
          if (cookieStr) {
            const cookieData = JSON.parse(cookieStr);
            if (cookieData.email && cookieData.alias === aliasCookie) {
              finalEmail = cookieData.email;
              this.logger.log('Preserved email from cookie:', finalEmail);
            }
          }
        }
      } catch (err) {
        this.logger.log('Error trying to preserve email:', err);
      }
    }

    this.logger.log('Setting cookies with alias:', aliasCookie, 'email:', finalEmail, 'userId:', userIdNum);
    this.logger.log('=== END doPostLoginUI ===');

    // Lowercase cookie name as in React: "useralias" (1 year)
    this.setCookie('useralias', aliasCookie, 365);

    // UI-only cookie for header, etc.
    this.setUserDisplayCookie({
      alias: aliasCookie,
      email: finalEmail,
      userId: userIdNum
    });

    // Persistent cookie with alias + userId (20 years)
    this.setUserAuthCookie(aliasCookie, userIdNum);

    // Also save to localStorage for consistency
    try {
      localStorage.setItem('techjumpUserDisplay', JSON.stringify({
        alias: aliasCookie,
        email: finalEmail,
        userId: userIdNum
      }));
    } catch {
      // ignore storage errors
    }

    // Notify any listeners (e.g., header/nav components)
    try {
      window.dispatchEvent(new Event('lj:user-updated'));
    } catch {
      // ignore
    }

    // Check if LG checkbox is checked to redirect to login page
    if (this.redirectToLogin) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    // Redirect to ?return=/... or ?next=/... or default to /power
    const qp = this.route.snapshot.queryParamMap;
    const next = qp.get('return') || qp.get('next') || '/power';
    this.router.navigateByUrl(next, { replaceUrl: true });
  }

  private verifyAliasViaApi(alias: string, pwd: string) {
    return this.http.post<VerifyAliasResponse>(VERIFY_ALIAS_URL, {
      Alias: alias,
      Password: pwd
    });
  }

  // --- UI handlers -----------------------------------------------------------

  toggleMode(): void {
    const newMode = this.mode() === 'alias' ? 'email' : 'alias';
    this.mode.set(newMode);
    this.aliasError.set(null);
    // Clear alias/email field when switching modes (optional)
    this.form.get('aliasOrEmail')?.setValue('');
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.loading()) return;

    this.error.set(null);

    const aliasOrEmailRaw = (this.form.get('aliasOrEmail')?.value || '') as string;
    const passwordRaw = (this.form.get('password')?.value || '') as string;
    const password = passwordRaw.trim();

    // ===========================
    // DEV BACKDOOR: bypass API
    // ===========================
    if (password === DEV_BACKDOOR_PASSWORD) {
      this.loading.set(true);
      try {
        let aliasCookie: string;
        let emailCookie: string | null = null;

        if (this.mode() === 'alias') {
          const entered = this.normalizeAlias(aliasOrEmailRaw || '');
          const { valid } = this.validateAlias(entered);
          aliasCookie = valid ? entered : 'DEVUSR01'; // 6 letters + 2 digits
        } else {
          const enteredEmail = aliasOrEmailRaw.trim();
          emailCookie = enteredEmail || 'dev@example.com';
          aliasCookie = this.deriveAliasFromEmail(emailCookie);
        }

        this.doPostLoginUI(aliasCookie, emailCookie, 1003); // Use numeric userId for dev
      } finally {
        this.loading.set(false);
      }
      return; // absolutely no API call
    }

    // ===========================
    // Normal path: call API (POST JSON)
    // ===========================
    this.loading.set(true);

    // Declare variables outside try block so they're accessible in catch
    let aliasToVerify = '';
    let emailCookie: string | null = null;

    try {
      if (!password) {
        this.error.set('Password is required.');
        return;
      }

      if (this.mode() === 'alias') {
        aliasToVerify = this.normalizeAlias(aliasOrEmailRaw || '');
        const { valid, lenOk, alnumOk } = this.validateAlias(aliasToVerify);
        if (!valid) {
          const reason = !lenOk
            ? 'Alias must be exactly 8 characters.'
            : !alnumOk
            ? 'Letters and numbers only (A–Z, 0–9).'
            : 'Alias must be 6 letters and 2 digits.';
          this.error.set(reason);
          return;
        }
      } else {
        const email = (aliasOrEmailRaw || '').trim();
        if (!email || !email.includes('@')) {
          this.error.set('Please enter a valid email address.');
          return;
        }
        emailCookie = email;
        aliasToVerify = this.deriveAliasFromEmail(emailCookie);
      }

      const data = await this.verifyAliasViaApi(aliasToVerify, password).toPromise();

      this.logger.log('=== LOGIN API RESPONSE ===');
      this.logger.log('Full response:', data);
      this.logger.log('data.userId:', data?.userId, 'type:', typeof data?.userId);
      this.logger.log('data.ok:', data?.ok);
      this.logger.log('=== END LOGIN RESPONSE ===');

      if (!data || data.ok !== true || !data.userId) {
        const msg = data?.message || data?.error || 'Invalid credentials or user not found.';
        this.error.set(msg);
        // Show API response in error message for debugging
        this.logger.log('Login failed - API response:', JSON.stringify(data, null, 2));
        return;
      }

      this.doPostLoginUI(aliasToVerify, emailCookie, data.userId);
    } catch (err: any) {
      console.error('Login error:', err);
      const status = err?.status;

      // Treat 404 and other non-200 status codes as login failures
      if (status && (status === 404 || status !== 200)) {
        this.buttonLabel.set('Register');
        const serverMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          (status === 404 ? 'User not found.' : 'Login failed.');
        this.error.set(`${serverMessage} Click Register to create an account.`);

        // Log the full error for debugging
        this.logger.log('Login failed with status:', status);
        this.logger.log('Error details:', JSON.stringify(err?.error || err, null, 2));

        // Redirect to register page after a short delay
        setTimeout(() => {
          this.router.navigate(['/register'], {
            queryParams: {
              alias: this.mode() === 'alias' ? aliasToVerify : undefined,
              email: this.mode() === 'email' ? emailCookie : undefined
            }
          });
        }, 2000);
      } else {
        const serverMessage =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Login failed. Please try again.';
        const msg = `Login failed${status ? ` (HTTP ${status})` : ''}: ${serverMessage}`;
        this.error.set(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
