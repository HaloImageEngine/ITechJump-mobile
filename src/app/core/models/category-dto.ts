// src/app/core/models/category-dto.ts

// Matches the API response from /Tech/GetDropDownCat
// [
//   { "ID": 100, "Category": "OOP", "Description": "OOP Testing Questions", "Sequence": "0" },
//   ...
// ]
export interface CategoryDto {
  ID: number;
  Category: string;
  Description: string;
  Sequence: string;
}
