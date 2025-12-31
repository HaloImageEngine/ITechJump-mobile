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
  private readonly baseUrlStripe = 'https://localhost:44360/api/ITechJump';

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
   * POST to: https://techinterviewjump.com/api/ITechJump/Tech/InsertAnswerScore
   */
  submitAnswer(questionId: number, userId: string, category: string, answer: string): Observable<any> {
    const url = `${this.baseUrl}/Tech/InsertAnswerScore`;
    const payload = {
      QuestionID: questionId,
      UserID: userId,
      Category: category,
      Answer: answer
    };
    console.log('Submitting to URL:', url);
    console.log('Payload:', payload);
    return this.http.post<any>(url, payload);
  }

  /**
   * Get keywords/hints for a specific question.
   * GET: https://techinterviewjump.com/api/ITechJump/Tech/GetKeywordbyQID?qid={qid}
   */
  getKeywordsByQuestionId(questionId: number): Observable<any[]> {
    const url = `${this.baseUrl}/Tech/GetKeywordbyQID?qid=${questionId}`;
    return this.http.get<any[]>(url);
  }

  /**
   * Get test results by user ID.
   * GET: https://techinterviewjump.com/api/ITechJump/Tech/GetTestResultsbyUserId?userid={userid}
   */
  getTestResultsByUserId(userId: string): Observable<any[]> {
    const url = `${this.baseUrl}/Tech/GetTestResultsbyUserId?userid=${userId}`;
    return this.http.get<any[]>(url);
  }

  /**
   * Get test result detail by test ID.
   * GET: https://techinterviewjump.com/api/ITechJump/Tech/GetTestResultsbyTestId?testid={testid}
   */
  getTestResultByTestId(testId: number): Observable<any> {
    const url = `${this.baseUrl}/Tech/GetTestResultsbyTestId?testid=${testId}`;
    return this.http.get<any>(url);
  }

  /**
   * Create Stripe SetupIntent (backend endpoint).
   * POST: https://techinterviewjump.com/api/stripe/create-setup-intent
   */
  createSetupIntent(userId: string | number, userAlias: string): Observable<{
    clientSecret: string;
    customerId: string;
  }> {
    const url = `${this.baseUrlStripe}/Stripe/create-setup-intent`;
    return this.http.post<any>(url, { userId, userAlias });
  }

  /**
   * Create Stripe Subscription (backend endpoint).
   * POST: https://techinterviewjump.com/api/stripe/create-subscription
   */
  createStripeSubscription(data: {
    customerId: string;
    paymentMethodId: string;
    planCode: string;
  }): Observable<{
    subscriptionId: string;
    clientSecret?: string;
  }> {
    const url = `${this.baseUrlStripe}/Stripe/create-subscription`;
    return this.http.post<any>(url, data);
  }

  /**
   * Create a Stripe Checkout Session (hosted Checkout page).
   * POST: https://techinterviewjump.com/api/ITechJump/stripe/create-checkout-session
   */
  createCheckoutSession(data: {
    userId: number | string;
    userAlias: string;
    planCode?: string;
    userEmail?: string;
  }): Observable<{ ok?: boolean; id?: string; url?: string; checkoutUrl?: string; sessionId?: string; checkoutSessionId?: string }> {
    const url = `${this.baseUrl}/stripe/create-checkout-session`;
    const body = {
      userId: data.userId,
      userAlias: data.userAlias,
      userEmail: data.userEmail ?? '',
      // Forward the planCode provided by the caller (typically the StripePriceId
      // coming from the dynamic products API), avoiding any hard-coded price ids.
      planCode: data.planCode
    };
    console.log('createCheckoutSession payload JSON:', JSON.stringify(body, null, 2));
    return this.http.post<{ ok?: boolean; id?: string; url?: string; checkoutUrl?: string; sessionId?: string; checkoutSessionId?: string }>(url, body);
  }

  /**
   * Create subscription record in ITechJump database.
   * POST: https://techinterviewjump.com/api/ITechjumpsubscription
   */
  createSubscription(subscriptionData: {
    UserId: number | string;
    UserAlias: string;
    PlanCode: string;
    StripePaymentIntentId: string;
    StripeChargeId: string;
    StripeCustomerId: string;
    StripePaymentMethodId: string;
  }): Observable<any> {
    const url = 'https://techinterviewjump.com/api/ITechjumpsubscription';
    return this.http.post<any>(url, subscriptionData);
  }

  /**
   * Call consolidated Stripe payment + subscription endpoint.
   * POST: {baseUrlStripe}/Stripe/call-payment
   */
  callStripePayment(request: {
    UserId: number | string;
    UserAlias: string;
    PlanCode: string;
    StripePaymentIntentId?: string;
    StripeChargeId?: string;
    StripeCustomerId?: string;
    StripePaymentMethodId: string;
  }): Observable<any> {
    // Matches curl:
    // POST https://techinterviewjump.com/api/ITechjumpsubscription/CallStripePayment
    const url = 'https://techinterviewjump.com/api/ITechjumpsubscription/CallStripePayment';
    // Stringified for easier inspection in dev tools
    console.log('callStripePayment payload JSON:', JSON.stringify(request, null, 2));
    return this.http.post<any>(url, request);
  }
}
