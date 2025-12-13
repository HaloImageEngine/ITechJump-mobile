import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const API_BASE = 'https://techinterviewjump.com';
const CONTACT_URL = `${API_BASE}/api/profile/support/contact`;

interface ContactResponse {
  TicketId?: number;
  Status?: string;
  Message?: string;
  ok?: boolean;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-contact',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    subject: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    userId: ['', [Validators.required]],
    userAlias: ['', [Validators.required]],
    comment: ['', [Validators.required, Validators.minLength(10)]]
  });

  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  subjectOptions = [
    { value: 'Billing', label: 'Billing' },
    { value: 'UI Issue', label: 'UI Issue' },
    { value: 'Questions', label: 'Questions' },
    { value: 'Improvements', label: 'Improvements' }
  ];

  ngOnInit() {
    this.loadUserInfo();
  }

  private loadUserInfo() {
    try {
      let userId = '';
      let userAlias = '';
      let email = '';

      // Try to get user info from ljUserDisplay cookie first (has email)
      const displayCookie = this.getCookie('ljUserDisplay');
      if (displayCookie) {
        const displayData = JSON.parse(displayCookie);
        userId = displayData.userId || '';
        userAlias = displayData.alias || '';
        email = displayData.email || '';
      }

      // Fall back to ljUserAuth cookie if no userId yet (no email in this cookie)
      if (!userId) {
        const authCookie = this.getCookie('ljUserAuth');
        if (authCookie) {
          const authData = JSON.parse(authCookie);
          userId = authData.userId || '';
          userAlias = authData.alias || '';
        }
      }

      // Check localStorage for any missing info (especially email)
      const storedUser = localStorage.getItem('techjumpUserDisplay');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (!userId) userId = userData.userId || '';
        if (!userAlias) userAlias = userData.alias || '';
        if (!email) email = userData.email || '';
      }

      // Also check itechjumpUserDisplay in localStorage as another fallback
      if (!email) {
        const storedUser2 = localStorage.getItem('itechjumpUserDisplay');
        if (storedUser2) {
          const userData2 = JSON.parse(storedUser2);
          if (!email) email = userData2.email || '';
        }
      }

      // Patch all found values into the form
      this.form.patchValue({
        userId,
        userAlias,
        email
      });
    } catch (error) {
      console.error('Error loading user info:', error);
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

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const formValue = this.form.value;
    const payload = {
      dtid: new Date().toISOString(),
      userID: Number(formValue.userId),
      userAlias: formValue.userAlias,
      subject: formValue.subject,
      comment: formValue.comment,
      email: formValue.email
    };

    console.log('Contact form payload:', payload);
    console.log('Sending to:', CONTACT_URL);

    try {
      const response = await this.http.post<ContactResponse>(CONTACT_URL, payload).toPromise();

      console.log('Contact API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response ok?:', response?.ok);
      console.log('Response.ok value:', response?.ok);
      console.log('Response.ok type:', typeof response?.ok);
      console.log('Full response structure:', JSON.stringify(response, null, 2));

      // Check if response has TicketId (new API format) or ok property (old format)
      if (response?.TicketId || response?.ok) {
        this.success.set(true);
        const successMsg = response?.Message || response?.message || 'Support ticket submitted successfully!';
        this.snackBar.open(successMsg, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.form.reset();
        this.loadUserInfo(); // Reload user info after reset
      } else {
        console.log('Response not ok, message:', response?.message, 'error:', response?.error);
        const msg = response?.message || response?.error || 'Failed to submit support ticket.';
        this.error.set(msg);
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      console.error('Error details:', {
        status: err?.status,
        statusText: err?.statusText,
        error: err?.error,
        message: err?.message
      });
      const msg = err?.error?.message || err?.message || 'Failed to submit support ticket. Please try again.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.touched || !field?.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Comment must be at least ${minLength} characters`;
    }
    return '';
  }
}
