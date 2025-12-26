import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';
import { AuthService } from '../../core/services/auth.service';

interface TestResult {
  AnswerResponseId: number;
  UserID: number;
  UserAlias: string;
  QuestionID: number;
  QuestionShort: string;
  AnswerShort: string;
  Score: string;
}

@Component({
  selector: 'app-review',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  standalone: true,
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
})
export class ReviewComponent implements OnInit {
  private api = inject(ItechjumpApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  testResults = signal<TestResult[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  displayedColumns: string[] = ['AnswerResponseId', 'QuestionShort', 'AnswerShort', 'Score', 'actions'];

  ngOnInit(): void {
    this.loadTestResults();
  }

  loadTestResults(): void {
    // Get userId from AuthService with fallback
    let userId = this.authService.getUserId();
    if (!userId) {
      userId = this.authService.getUserIdFromCookie();
    }

    if (!userId) {
      this.error.set('User ID not found. Please log in.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api.getTestResultsByUserId(userId).subscribe({
      next: (results) => {
        console.log('Test results loaded:', results);
        this.testResults.set(results || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading test results', err);
        this.error.set('Failed to load test results. Please try again.');
        this.loading.set(false);
      }
    });
  }

  viewDetail(testId: number): void {
    this.router.navigate(['/review-detail', testId]);
  }
}
