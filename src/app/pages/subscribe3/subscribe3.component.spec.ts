import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subscribe3Component } from './subscribe3.component';

describe('Subscribe3Component', () => {
  let component: Subscribe3Component;
  let fixture: ComponentFixture<Subscribe3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subscribe3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Subscribe3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
