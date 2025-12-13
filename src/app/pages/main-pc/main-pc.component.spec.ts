import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPcComponent } from './main-pc.component';

describe('MainPcComponent', () => {
  let component: MainPcComponent;
  let fixture: ComponentFixture<MainPcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
