import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // User ID signal
  private userIdSignal = signal<string | null>(null);

  /**
   * Get the current userId value
   */
  getUserId(): string | null {
    return this.userIdSignal();
  }

  /**
   * Set the userId (called from header or login components)
   */
  setUserId(userId: string | null): void {
    this.userIdSignal.set(userId);
  }

  /**
   * Get userId from cookies (fallback method)
   */
  getUserIdFromCookie(): string | null {
    try {
      if (typeof document === 'undefined') return null;
      const authCookie = this.getCookie('ljUserAuth');
      if (authCookie) {
        const authData = JSON.parse(authCookie);
        return authData?.userId || authData?.UserId || null;
      }
    } catch (err) {
      console.error('Error reading userId from cookie', err);
    }
    return null;
  }

  /**
   * Read a cookie by name
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
}
