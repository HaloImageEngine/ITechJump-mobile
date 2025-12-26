import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NavComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Auth state
  isLoggedIn = false;
  userAlias: string | null = null; // e.g., 'WDBeaty' when available
  userId: string | null = null; // e.g., '1003' when available
  authLabel: 'Register' | 'Login' | 'LogOff' = 'Register';

  // Version modal
  showVersion = signal(false);
  version = environment.appVersion;

  // Keep a reference so we can remove the listener on destroy
  private userUpdatedHandler = () => {
    // LoginComponent fires this after successful login
    this.isLoggedIn = true;
    this.refreshAuthStateFromCookies();
  };

  ngOnInit(): void {
    // Initial cookie read
    this.refreshAuthStateFromCookies();

    // Listen for login component updates
    if (typeof window !== 'undefined') {
      window.addEventListener('lj:user-updated', this.userUpdatedHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('lj:user-updated', this.userUpdatedHandler);
    }
  }

  // ----------------- Helpers -----------------

  /**
   * Read a cookie by name from document.cookie.
   */
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

  /**
   * Refresh alias & button label from cookies and local isLoggedIn flag.
   *
   * Rules:
   *  1. If user is logged in AND cookie available => "LogOff"
   *  2. If user is NOT logged in AND NO cookie   => "Register"
   *  3. If cookie available but user is logged off => "Login"
   */
  private refreshAuthStateFromCookies(): void {
    const aliasCookie = this.getCookie('useralias');
    this.userAlias = aliasCookie && aliasCookie.trim().length > 0
      ? aliasCookie.trim()
      : null;

    // Debug: Log all storage and cookie data
    console.log('=== HEADER COMPONENT DEBUG ===');
    console.log('localStorage itechjumpUserDisplay:', localStorage.getItem('itechjumpUserDisplay'));
    console.log('localStorage techjumpUserDisplay:', localStorage.getItem('techjumpUserDisplay'));
    console.log('Cookie useralias:', this.getCookie('useralias'));
    console.log('Cookie ljUserAuth:', this.getCookie('ljUserAuth'));
    console.log('Cookie ljUserDisplay:', this.getCookie('ljUserDisplay'));

    // Read userId from ljUserAuth cookie
    try {
      const authCookie = this.getCookie('ljUserAuth');
      console.log('Raw authCookie string:', authCookie);
      if (authCookie) {
        const authData = JSON.parse(authCookie);
        console.log('Parsed authData:', authData);
        this.userId = authData?.userId || authData?.UserId || null;
        console.log('Extracted userId:', this.userId, 'type:', typeof this.userId);
        // Update AuthService with userId
        this.authService.setUserId(this.userId);
      } else {
        this.userId = null;
        console.log('No authCookie found, userId set to null');
        this.authService.setUserId(null);
      }
    } catch (err) {
      console.error('Error parsing ljUserAuth cookie:', err);
      this.userId = null;
    }
    console.log('=== END DEBUG ===');

    const hasAliasCookie = !!this.userAlias;

    if (this.isLoggedIn && hasAliasCookie) {
      this.authLabel = 'LogOff';
    } else if (!this.isLoggedIn && !hasAliasCookie) {
      this.authLabel = 'Register';
    } else if (!this.isLoggedIn && hasAliasCookie) {
      this.authLabel = 'Login';
    } else {
      // Fallback: treat as logged out with no cookie
      this.authLabel = 'Register';
    }
  }

  onAuthClick(): void {
    // Decide action based on current label
    if (this.authLabel === 'LogOff') {
      // Mark as logged off and CLEAR the alias to hide it
      this.isLoggedIn = false;
      this.userAlias = null; // ✅ Clear alias on logoff
      // (Optional) you could clear additional auth cookies/token here
      console.log('LogOff clicked - mark user as logged out, alias cleared');
      this.refreshAuthStateFromCookies();
      // Navigate to logoff page
      this.router.navigate(['/logoff']);
    } else if (this.authLabel === 'Login') {
      this.userAlias = null;
      this.router.navigate(['/login']);
    } else if (this.authLabel === 'Register') {
      this.router.navigate(['/register']);
    }
  }

  openVersion() {
    this.showVersion.set(true);
  }

  closeVersion() {
    this.showVersion.set(false);
  }
}
