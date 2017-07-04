import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { MapService } from './map.service';
import { AuthenticationService } from './../shared/authentication.service';

describe('MapService', () => {
  
  // Mock
  let authenticationServiceStub = {};
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        MapService, 
        {provide: AuthenticationService, useValue: authenticationServiceStub}
      ]
    });
  });

  it('should be created', inject([MapService], (service: MapService) => {
    expect(service).toBeTruthy();
  }));
});
