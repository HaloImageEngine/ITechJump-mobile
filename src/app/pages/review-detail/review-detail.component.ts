import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';

interface TestResultDetail {
  AnswerResponseId: number;
  UserID: number;
  UserAlias: number | string;
  QuestionID: string;
  QuestionFull: string;
  AnswerUser: string;
  AnswerFull: string;
  Score: number;
  ScoreDesc: string;
}

@Component({
  selector: 'app-review-detail',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './review-detail.component.html',
  styleUrl: './review-detail.component.scss',
})
export class ReviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ItechjumpApiService);

  testDetail = signal<TestResultDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  testId: number | null = null;

  ngOnInit(): void {
    // Get testid from route params
    this.route.params.subscribe(params => {
      const id = params['testid'];
      if (id) {
        this.testId = +id;
        this.loadTestDetail(this.testId);
      } else {
        this.error.set('Test ID not found in route.');
      }
    });
  }

  loadTestDetail(testId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getTestResultByTestId(testId).subscribe({
      next: (result) => {
        console.log('Test detail loaded:', result);
        this.testDetail.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading test detail', err);
        this.error.set('Failed to load test details. Please try again.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/review']);
  }
}
