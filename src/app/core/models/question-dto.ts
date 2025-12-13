// src/app/core/models/question-dto.ts

// Expected shape for Questions.
// Adjust names if your API returns different property names.
export interface QuestionDto {
  ID: number;
  Category: string;
  Question: string;
  Answer: string;
  CreateDate?: string | null;
}
