import { TestBed } from '@angular/core/testing';

import { ItechjumpApi } from './itechjump-api';

describe('ItechjumpApi', () => {
  let service: ItechjumpApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItechjumpApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
