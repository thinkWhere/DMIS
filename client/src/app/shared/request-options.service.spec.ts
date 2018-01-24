import { TestBed, inject } from '@angular/core/testing';

import { RequestOptionsService } from './request-options.service';

describe('RequestOptionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequestOptionsService]
    });
  });

  it('should be created', inject([RequestOptionsService], (service: RequestOptionsService) => {
    expect(service).toBeTruthy();
  }));
});
