import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { LayerService } from './layer.service';
import { AuthenticationService } from './../shared/authentication.service';

describe('LayerService', () => {

   // Mock
  let authenticationServiceStub = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        LayerService, 
        {provide: AuthenticationService, useValue: authenticationServiceStub}
      ]
    });
  });

  it('should be created', inject([LayerService], (service: LayerService) => {
    expect(service).toBeTruthy();
  }));
});
