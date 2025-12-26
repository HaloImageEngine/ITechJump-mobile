// src/app/pages/pc-test/pc-test.component.ts

import { Component, computed, effect, signal, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryDto } from '../../core/models/category-dto';
import { QuestionDto } from '../../core/models/question-dto';

@Component({
  selector: 'app-pc-test',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatListModule
  ],
  templateUrl: './pc-test.component.html',
  styleUrl: './pc-test.component.scss'
})
export class PcTestComponent {
  // --- signals / state ---
  categories = signal<CategoryDto[]>([]);
  questions = signal<QuestionDto[]>([]);

  selectedCategory = signal<string | null>(null);
  selectedQuestionId = signal<number | null>(null);

  loadingCategories = signal(false);
  loadingQuestions = signal(false);
  error = signal<string | null>(null);

  showAnswer = signal(false);
  submittingAnswer = signal(false);

  // User's answer input
  userAnswer = '';

  // Grade response from API
  gradeResponse = signal<any>(null);

  // derived: current selected question object
  selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    if (!id) return null;
    return this.questions().find(q => q.ID === id) ?? null;
  });

  constructor(
    private api: ItechjumpApiService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    // load categories on init
    this.loadCategories();

    // whenever selectedCategory changes, reload questions
    effect(() => {
      const cat = this.selectedCategory();
      if (cat) {
        this.loadQuestions(cat);
      } else {
        this.questions.set([]);
        this.selectedQuestionId.set(null);
        this.showAnswer.set(false);
      }
    });
  }

  // --- API calls ---

  loadCategories(): void {
    this.loadingCategories.set(true);
    this.error.set(null);

    this.api.getCategories().subscribe({
      next: (cats) => {
        console.log('Categories loaded:', cats);
        this.categories.set(cats || []);
        this.loadingCategories.set(false);
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.error.set('Could not load categories.');
        this.loadingCategories.set(false);
      }
    });
  }

  loadQuestions(cat: string): void {
    this.loadingQuestions.set(true);
    this.error.set(null);
    this.showAnswer.set(false);
    this.selectedQuestionId.set(null);

    this.api.getQuestionsByCategory(cat).subscribe({
      next: (qs) => {
        console.log('Questions loaded for', cat, qs);
        this.questions.set(qs || []);
        this.loadingQuestions.set(false);
      },
      error: (err) => {
        console.error('Error loading questions', err);
        this.error.set('Could not load questions for this category.');
        this.loadingQuestions.set(false);
      }
    });
  }

  // --- UI handlers ---

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
  }

  onSelectQuestion(id: number): void {
    this.selectedQuestionId.set(id);
    this.showAnswer.set(false);
    this.userAnswer = ''; // Clear user answer when changing questions
    this.gradeResponse.set(null); // Clear grade response
  }

  onShowAnswer(): void {
    if (this.selectedQuestion()) {
      this.showAnswer.set(true);
    }
  }

  onGetHint(): void {
    const questionId = this.selectedQuestionId();
    if (!questionId) return;

    console.log('Get hint for question ID:', questionId);

    this.api.getKeywordsByQuestionId(questionId).subscribe({
      next: (keywords) => {
        console.log('Keywords received:', keywords);
        // Extract just the keyword strings
        const keywordList = keywords.map(k => k.Keyword);

        // Show dialog with keywords
        const dialogRef = this.dialog.open(HintDialogComponent, {
          width: '500px',
          data: { keywords: keywordList }
        });
      },
      error: (err) => {
        console.error('Error getting hint', err);
        this.error.set('Failed to load hints. Please try again.');
      }
    });
  }

  onSubmitAnswer(): void {
    const questionId = this.selectedQuestionId();
    const category = this.selectedCategory();
    const answer = this.userAnswer.trim();

    if (!answer || !questionId || !category) {
      return;
    }

    // Get userId from AuthService, fallback to cookie, then default to "1019"
    let userId = this.authService.getUserId();
    if (!userId) {
      userId = this.authService.getUserIdFromCookie();
    }
    if (!userId) {
      userId = "1019"; // Default fallback
    }

    console.log('Submitting answer for question ID:', questionId);
    console.log('Category:', category);
    console.log('User ID:', userId);
    console.log('User answer:', answer);

    this.submittingAnswer.set(true);
    this.error.set(null);

    this.api.submitAnswer(questionId, userId, category, answer).subscribe({
      next: (response) => {
        console.log('Answer submitted successfully', response);
        this.gradeResponse.set(response);
        this.submittingAnswer.set(false);
      },
      error: (err) => {
        console.error('Error submitting answer', err);
        this.error.set('Failed to submit answer. Please try again.');
        this.submittingAnswer.set(false);
      }
    });
  }

  getQuestionPreview(q: QuestionDto): string {
    const text = q.Question ?? '';
    return text.length > 80 ? text.substring(0, 80) + '…' : text;
  }
}

// Hint Dialog Component
@Component({
  selector: 'app-hint-dialog',
  standalone: true,
  imports: [MatDialogModule, MatListModule, MatButtonModule, MatIconModule, NgFor],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align: middle; margin-right: 8px;">lightbulb</mat-icon>
      Hint: Key Topics
    </h2>
    <mat-dialog-content>
      <p style="margin-bottom: 16px; color: #666;">
        These are the key concepts to include in your answer:
      </p>
      <mat-list>
        <mat-list-item *ngFor="let keyword of data.keywords" style="border-left: 3px solid #a3ff00; margin-bottom: 8px; padding-left: 12px;">
          <mat-icon matListItemIcon style="color: #4CAF50;">check_circle</mat-icon>
          <div matListItemTitle style="font-weight: 500;">{{ keyword }}</div>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      padding: 20px;
    }
    mat-list {
      padding: 0;
    }
    mat-list-item {
      margin-bottom: 8px;
      height: auto !important;
      min-height: 48px;
    }
  `]
})
export class HintDialogComponent {
  data = inject<any>(MAT_DIALOG_DATA);
}
