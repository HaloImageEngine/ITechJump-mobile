// src/app/register/register.component.ts
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

const API_BASE = 'https://techinterviewjump.com';

// 50 U.S. states (same set as React)
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]);

interface ServerMsg {
  type: '' | 'info' | 'error';
  text: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  submitting = signal(false);
  showPassword = signal(false);

  serverMsg: ServerMsg = { type: '', text: '' };

  // snack for alias pattern warning (6 letters + 2 numbers)
  private aliasWarnOpen = false;

  showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.buildForm();
    // Add password match validator
    this.form.addValidators(this.passwordMatchValidator.bind(this));
  }

  // --- Form building ---
  private buildForm(): FormGroup {
    return this.fb.group({
      firstName: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]
      ],
      middleInitial: [
        '',
        [Validators.pattern(/^[A-Za-z]?$/)]
      ],
      lastName: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]
      ],
      email: [
        '',
        [Validators.required, Validators.email]
      ],
      userAlias: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(8),
          this.aliasValidator.bind(this)
        ]
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(8)]
      ],
      confirmPassword: [
        '',
        [Validators.required]
      ],
      city: [''],
      state: [
        '',
        [this.stateValidator.bind(this)]
      ],
      zip: [
        '',
        [this.zipValidator.bind(this)]
      ],
      birthMonth: [0], // Default to 0, no validators
      phoneNum: [
        '',
        [this.phoneValidator.bind(this)]
      ]
    });
  }

  // --- Helpers from React port ---

  private normalizeAlias(v: string | null | undefined): string {
    return (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }

  private validateAliasCore(a: string) {
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

  private digitsOnly(s: string | null | undefined): string {
    return (s || '').replace(/\D/g, '');
  }

  private formatPhone(digits: string): string {
    const d = this.digitsOnly(digits);
    if (d.length === 10) {
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return d;
  }

  // --- Custom validators ---

  private aliasValidator(control: AbstractControl): ValidationErrors | null {
    const value = this.normalizeAlias(control.value);
    if (!value) {
      return { alias: 'Alias is required.' };
    }
    if (value.length !== 8) {
      return { alias: 'Alias must be exactly 8 characters.' };
    }

    const { valid } = this.validateAliasCore(value);
    if (!valid) {
      return { alias: 'Please use 6 alpha and 2 numbers for a total of 8 Characters.' };
    }
    return null;
  }

  private stateValidator(control: AbstractControl): ValidationErrors | null {
    const raw = (control.value || '') as string;
    const st = raw.toUpperCase();
    if (!st) return null; // optional
    if (st.length !== 2) {
      return { state: 'Use 2-letter state code.' };
    }
    if (!US_STATES.has(st)) {
      return { state: 'Not a valid U.S. state code.' };
    }
    return null;
  }

  private zipValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '') as string;
    if (!value) return null; // optional
    if (!/^\d{5}$/.test(value)) {
      return { zip: 'Zip must be 5 digits.' };
    }
    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const val = (control.value || '') as string;
    if (!val) return null; // optional

    const digits = this.digitsOnly(val);
    if (digits.length !== 10) {
      return { phoneNum: 'Phone must have exactly 10 digits.' };
    }

    return null;
  }

  // --- Template convenience getter ---
  get f() {
    return this.form.controls;
  }

  // --- Input handlers (to mirror React behavior) ---

  onFirstNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = (input.value || '').replace(/[^A-Za-z]/g, '');
    this.form.controls['firstName'].setValue(cleaned);
  }

  onLastNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = (input.value || '').replace(/[^A-Za-z]/g, '');
    this.form.controls['lastName'].setValue(cleaned);
  }

  onMiddleInitialInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const one = (input.value || '').slice(0, 1);
    this.form.controls['middleInitial'].setValue(one);
  }

  onStateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const up = (input.value || '').toUpperCase().slice(0, 2);
    this.form.controls['state'].setValue(up);
  }

  onZipInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const z = this.digitsOnly(input.value).slice(0, 5);
    this.form.controls['zip'].setValue(z);
  }

  onAliasInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeAlias(input.value);
    this.form.controls['userAlias'].setValue(normalized);

    // Live warning when length is 8 but pattern invalid
    if (normalized.length === 8) {
      const { valid } = this.validateAliasCore(normalized);
      if (!valid && !this.aliasWarnOpen) {
        this.aliasWarnOpen = true;
        this.snackBar
          .open(
            'Please use 6 alpha and 2 numbers for a total of 8 Characters.',
            'OK',
            {
              duration: 1600,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
              panelClass: ['alias-warn-snack']
            }
          )
          .afterDismissed()
          .subscribe(() => {
            this.aliasWarnOpen = false;
          });
      }
    }
  }

  // Phone: user types digits, we auto-format as ###-###-#### once enough digits
  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';

    // Strip non-digits and limit to 10
    const digits = this.digitsOnly(raw).slice(0, 10);

    let display = digits;
    if (digits.length > 3 && digits.length <= 6) {
      display = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 6) {
      display = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    this.form.controls['phoneNum'].setValue(display);
  }

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  // Password match validator
  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // --- Navigation ---

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // --- Cookie Management ---

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

  private setUserAuthCookie(alias: string, userId: string | number): void {
    try {
      const value = JSON.stringify({
        alias,
        userId: Number(userId) || 0  // Store as number
      });
      // Approx. "does not expire" by using a 20-year expiry (7300 days)
      this.setCookie('ljUserAuth', value, 7300);
    } catch {
      // swallow
    }
  }

  // --- Simple UI-only storage like setUserDisplayCookie (localStorage) ---
  private setUserDisplay(info: { alias: string; email: string; userId: number | null }) {
    try {
      localStorage.setItem('techjumpUserDisplay', JSON.stringify(info));
    } catch {
      // ignore storage errors
    }
  }

  // --- Submit ---

  onSubmit() {
    console.log('Form valid:', this.form.valid);
    console.log('Form value:', this.form.value);
    console.log('Form raw value:', this.form.getRawValue());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.log('Form is invalid, not submitting');
      return;
    }

    this.submitting.set(true);
    this.serverMsg = { type: '', text: '' };

    const v = this.form.value;

    console.log('Extracted form values:', v);

    const firstName = (v.firstName || '').toString().trim();
    const middleInitial = (v.middleInitial || '').toString().trim();
    const lastName = (v.lastName || '').toString().trim();
    const email = (v.email || '').toString().trim();
    const userAlias = (v.userAlias || '').toString().toUpperCase();
    const city = (v.city || '').toString().trim();
    const state = (v.state || '').toString().trim();
    const zip = (v.zip || '').toString().trim();
    const phoneRaw = (v.phoneNum || '').toString();

    const digits = this.digitsOnly(phoneRaw);
    const phoneFormatted = digits ? this.formatPhone(digits) : null; // ensures ###-###-####

    const payload = {
      FirstName: firstName,
      MiddleInitial: middleInitial || null,
      LastName: lastName,
      Email: email,
      UserAlias: userAlias,
      Password: v.password,
      City: city || null,
      State: state || null,
      Zip: zip || null,
      BirthMonth: 1, // Always send 6
      PhoneNum: phoneFormatted
    };

    // Debug logging
    console.log('Registration payload:', payload);

    this.http.post<any>(`${API_BASE}/api/Techjump/login/create`, payload).subscribe({
      next: (res) => {
        console.log('Registration response:', res);
        if (res?.ok) {
          const userId = res?.userId ?? null;

          // Set cookies for authentication (matching login component behavior)
          this.setCookie('useralias', userAlias, 365);
          this.setUserDisplayCookie({
            alias: userAlias,
            email,
            userId
          });
          this.setUserAuthCookie(userAlias, userId ?? '');

          // Set localStorage (keeping existing behavior)
          this.setUserDisplay({
            alias: userAlias,
            email,
            userId
          });

          // Notify header component to update auth state
          try {
            window.dispatchEvent(new Event('lj:user-updated'));
          } catch {
            // ignore
          }

          const first = firstName || 'there';
          this.snackBar.open(`Welcome, ${first}!`, undefined, {
            duration: 1400,
            verticalPosition: 'bottom',
            horizontalPosition: 'center',
            panelClass: ['success-snack']
          });

          setTimeout(() => {
            this.router.navigate(['/power'], { replaceUrl: true });
          }, 1200);
        } else {
          this.serverMsg = {
            type: 'error',
            text: 'Unexpected response from server.'
          };
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message
        });
        const apiMsg = err?.error?.error || err.message || 'Registration failed.';
        this.serverMsg = { type: 'error', text: apiMsg };
      },
      complete: () => {
        this.submitting.set(false);
      }
    });
  }

  onReset() {
    this.form.reset();
    this.form.patchValue({ birthMonth: 0 }); // Reset birthMonth back to 0
    this.serverMsg = { type: '', text: '' };
  }

  closeServerMsg() {
    this.serverMsg = { type: '', text: '' };
  }
}
