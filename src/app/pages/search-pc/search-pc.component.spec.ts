import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPcComponent } from './search-pc.component';

describe('SearchPcComponent', () => {
  let component: SearchPcComponent;
  let fixture: ComponentFixture<SearchPcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchPcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
