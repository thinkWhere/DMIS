import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { IdentifyService } from './identify.service';
import { LayerService } from './layer.service';
import { AuthenticationService } from './../shared/authentication.service';

describe('IdentifyService', () => {

   // Mock
  let layerServiceStub = {};

  beforeEach(() => {
    
    // Mock
    let authenticationServiceStub = {};
    
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [IdentifyService,
        {provide: LayerService, useValue: layerServiceStub},
        {provide: AuthenticationService, useValue: authenticationServiceStub}]
    });
  });

  it('should be created', inject([IdentifyService], (service: IdentifyService) => {
    expect(service).toBeTruthy();
  }));
});
