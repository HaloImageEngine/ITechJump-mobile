import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcTestComponent } from './pc-test.component';

describe('PcTestComponent', () => {
  let component: PcTestComponent;
  let fixture: ComponentFixture<PcTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PcTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PcTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
