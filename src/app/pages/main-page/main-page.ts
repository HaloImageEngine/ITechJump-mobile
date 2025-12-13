// src/app/pages/main-page/main-page.ts

import { Component, computed, effect, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';
import { CategoryDto } from '../../core/models/category-dto';
import { QuestionDto } from '../../core/models/question-dto';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule
  ],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss']
})
export class MainPageComponent {
  // --- signals / state ---
  categories = signal<CategoryDto[]>([]);
  questions = signal<QuestionDto[]>([]);

  selectedCategory = signal<string | null>(null);
  selectedQuestionId = signal<number | null>(null);

  loadingCategories = signal(false);
  loadingQuestions = signal(false);
  error = signal<string | null>(null);

  showAnswer = signal(false);

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
  }

  onShowAnswer(): void {
    if (this.selectedQuestion()) {
      this.showAnswer.set(true);
    }
  }

  getQuestionPreview(q: QuestionDto): string {
    const text = q.Question ?? '';
    return text.length > 80 ? text.substring(0, 80) + '…' : text;
  }
}
