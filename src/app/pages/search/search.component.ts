// src/app/pages/search-page/search.component.ts

import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { ItechjumpApiService } from '../../core/services/itechjump-api.service';
import { QuestionDto } from '../../core/models/question-dto';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'] // reuse same styling as main page
})
export class SearchComponent {
  // --- signals / state ---
  searchText = signal<string>('');

  questions = signal<QuestionDto[]>([]);
  selectedQuestionId = signal<number | null>(null);

  loadingQuestions = signal(false);
  error = signal<string | null>(null);

  showAnswer = signal(false);

  // derived: current selected question object
  selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    if (!id) return null;
    return this.questions().find(q => q.ID === id) ?? null;
  });

  constructor(private api: ItechjumpApiService) {}

  // --- API calls ---

  // Note: this reuses the same endpoint that category used before:
  // getQuestionsByCategory(searchTerm)
  loadQuestions(searchTerm: string): void {
    this.loadingQuestions.set(true);
    this.error.set(null);
    this.showAnswer.set(false);
    this.selectedQuestionId.set(null);

    this.api.getQuestionsBySearch(searchTerm).subscribe({
      next: (qs) => {
        console.log('Questions loaded for search term', searchTerm, qs);
        this.questions.set(qs || []);
        this.loadingQuestions.set(false);

        // if no results, show a helpful message
        if (!qs || !qs.length) {
          this.error.set('No questions found for that category.');
        }
      },
      error: (err) => {
        console.error('Error loading questions for search term', searchTerm, err);
        this.error.set('Could not load questions for this search.');
        this.loadingQuestions.set(false);
      }
    });
  }

  // --- UI handlers ---

  onSearchTextChange(value: string): void {
    this.searchText.set(value);

    // optional: clear results if text is cleared
    if (!value.trim()) {
      this.questions.set([]);
      this.selectedQuestionId.set(null);
      this.showAnswer.set(false);
      this.error.set(null);
    }
  }

  onSearch(): void {
    const term = this.searchText().trim();
    if (!term) {
      this.error.set('Please enter a category to search.');
      this.questions.set([]);
      this.selectedQuestionId.set(null);
      this.showAnswer.set(false);
      return;
    }

    this.loadQuestions(term);
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
