import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewAnswersPage } from './review-answers-page';

describe('ReviewAnswersPage', () => {
  let component: ReviewAnswersPage;
  let fixture: ComponentFixture<ReviewAnswersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewAnswersPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewAnswersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
