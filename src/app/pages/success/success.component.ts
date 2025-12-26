import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './success.component.html',
  styleUrl: './success.component.scss'
})
export class SuccessComponent implements OnInit {
  /** Stripe Checkout session id returned on success redirect */
  readonly sessionId = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('session_id');
    this.sessionId.set(id);
  }

  goToMain(): void {
    this.router.navigate(['/main-page']);
  }

  goToAccount(): void {
    // Adjust this navigation target as your post‑purchase page
    this.router.navigate(['/subscribe3']);
  }
}
