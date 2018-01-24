import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { StyleService } from './style.service';

describe('StyleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [StyleService]
    });
  });

  it('should be created', inject([StyleService], (service: StyleService) => {
    expect(service).toBeTruthy();
  }));
});
