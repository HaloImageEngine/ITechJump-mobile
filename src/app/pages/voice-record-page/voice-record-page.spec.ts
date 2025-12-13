import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceRecordPage } from './voice-record-page';

describe('VoiceRecordPage', () => {
  let component: VoiceRecordPage;
  let fixture: ComponentFixture<VoiceRecordPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceRecordPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceRecordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
