import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestPcCompoent } from './test-pc.compoent';

describe('TestPcCompoent', () => {
  let component: TestPcCompoent;
  let fixture: ComponentFixture<TestPcCompoent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestPcCompoent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestPcCompoent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
