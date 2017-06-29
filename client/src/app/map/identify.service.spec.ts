import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { IdentifyService } from './identify.service';
import { LayerService } from './layer.service';

describe('IdentifyService', () => {

   // Mock
  let layerServiceStub = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [IdentifyService,
        {provide: LayerService, useValue: layerServiceStub}]
    });
  });

  it('should be created', inject([IdentifyService], (service: IdentifyService) => {
    expect(service).toBeTruthy();
  }));
});
