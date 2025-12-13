// src/app/core/services/itechjump-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CategoryDto } from '../models/category-dto';
import { QuestionDto } from '../models/question-dto';

@Injectable({
  providedIn: 'root'
})
export class ItechjumpApiService {
  // Base API URL for ITechJump
  // You can hit: https://techinterviewjump.com/api/ITechJump/db-ping for a quick sanity check
  private readonly baseUrl = 'https://techinterviewjump.com/api/ITechJump';

  constructor(private http: HttpClient) {}

  /**
   * Load all categories for the dropdown.
   * API expects ?cat=cat to mean "all categories".
   */
  getCategories(): Observable<CategoryDto[]> {
    const url = `${this.baseUrl}/Tech/GetDropDownCat?cat=cat`;
    return this.http.get<CategoryDto[]>(url);
  }

  /**
   * Load questions for a given category.
   */
  getQuestionsByCategory(cat: string): Observable<QuestionDto[]> {
    const url = `${this.baseUrl}/Tech/GetGetQuestionsbyCat?cat=${encodeURIComponent(cat)}`;
    return this.http.get<QuestionDto[]>(url);
  }

  /**
   * Search questions by keyword.
   * Uses: https://techinterviewjump.com/api/ITechJump/Tech/GetSearchKeyword?keyword={keyword}
   */
  getQuestionsBySearch(keyword: string): Observable<QuestionDto[]> {
    const url = `${this.baseUrl}/Tech/GetSearchKeyword?keyword=${encodeURIComponent(keyword)}`;
    return this.http.get<QuestionDto[]>(url);
  }

  /**
   * Submit user's answer for grading.
   * POST to: https://techinterviewjump.com/api/ITechJump/Tech/InsertAnswer
   */
  submitAnswer(questionId: number, answer: string): Observable<any> {
    const url = `${this.baseUrl}/Tech/InsertAnswer`;
    const payload = {
      QuestionID: questionId,
      Answer: answer
    };
    console.log('Submitting to URL:', url);
    console.log('Payload:', payload);
    return this.http.post<any>(url, payload);
  }
}
