// src/app/pages/pc-test/pc-test.component.ts

import { Component, computed, effect, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';
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
    MatChipsModule
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

  constructor(private api: ItechjumpApiService) {
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
    // TODO: Implement API call to get hint for current question
    const questionId = this.selectedQuestionId();
    console.log('Get hint for question ID:', questionId);

    // Placeholder - will call API endpoint like:
    // this.api.getHint(questionId).subscribe({
    //   next: (hint) => { /* display hint */ },
    //   error: (err) => { console.error('Error getting hint', err); }
    // });

    alert('Hint feature coming soon! This will call the API to get a hint for this question.');
  }

  onSubmitAnswer(): void {
    const questionId = this.selectedQuestionId();
    const answer = this.userAnswer.trim();

    if (!answer || !questionId) {
      return;
    }

    console.log('Submitting answer for question ID:', questionId);
    console.log('User answer:', answer);

    this.submittingAnswer.set(true);
    this.error.set(null);

    this.api.submitAnswer(questionId, answer).subscribe({
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
