import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private enabled = !environment.production;

  log(...args: any[]): void {
    if (this.enabled) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    // Always log errors, even in production
    console.error(...args);
  }

  warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.enabled) {
      console.debug(...args);
    }
  }
}
